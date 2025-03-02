<template>
    <div id="veil">
        <div id="progress-bar"><div id="progress"></div></div>
    </div>
    <div id="container"></div>
</template>

<script>
import * as THREE from "three"
import * as dat from 'dat.gui'
import Stats from "three/examples/jsm/libs/stats.module"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

// Core boilerplate code deps
import { createCamera, createRenderer, runApp, updateLoadingProgressBar } from "../three/core-utils"

// Other deps
import { loadTexture } from "../three/common-utils"
import Day from "../assets/day.jpg"
import Clouds from "../assets/specularClouds.jpg"
import Night from "../assets/night.jpg"
import StarMap from "../assets/starmap.png"
import earthVertexShader from "../shaders/earth/vertex.glsl"
import earthFragmentShader from "../shaders/earth/fragment.glsl"
import atmosphereVertexShader from "../shaders/atmosphere/vertex.glsl"
import atmosphereFragmentShader from "../shaders/atmosphere/fragment.glsl"
import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'satellite.js';

export default {
  name: 'ThreeScene',
  props: {
    items: Object // Expecting an array of items
  },
  watch: {
    items(newVal) {
      console.log("Updated items in ThreeScene:", newVal);
    }
  },
  data() {
    return {
      camera: null,
      scene: null,
      renderer: null
    }
  },
  methods: {
    init: function() {

        global.THREE = THREE
        THREE.ColorManagement.enabled = true

        let scene = new THREE.Scene()
        let renderer = createRenderer({ antialias: true }, (_renderer) => {
            _renderer.outputColorSpace = THREE.SRGBColorSpace
        })

        const vueComponent = this
        let camera = createCamera(45, 1, 1000, { x: 0, y: 0, z: 20 })

        let app = {
            // Store satellite data at the app level
            satrec: null,
            satMesh: null,
            orbitLine: null,
            earthRadius: 5,
            scaleFactor: 5 / 6371,
            // Add properties for the GUI
            satelliteInfo: {
                latitude: 0.0,
                longitude: 0.0,
                altitude: 0.0
            },
            gui: null,
            
            async initScene() {

                this.controls = new OrbitControls(camera, renderer.domElement)
                this.controls.enableDamping = true

                const size = 20;
                const divisions = 20;
                const gridHelper = new THREE.GridHelper(size, divisions);
                scene.add(gridHelper);

                const axesHelper = new THREE.AxesHelper(10);
                scene.add(axesHelper);
                
                const polarGridHelper = new THREE.PolarGridHelper(10, 16, 8, 64);
                polarGridHelper.rotation.x = Math.PI / 2;
                scene.add(polarGridHelper);

                const earthParameters = {}
                earthParameters.atmosphereDayColor = '#00aaff'
                earthParameters.atmosphereTwilightColor = '#ff6600'
 

                const earthDayTexture = await loadTexture(Day)
                earthDayTexture.colorSpace = THREE.SRGBColorSpace
                earthDayTexture.anisotropy = 8
                await updateLoadingProgressBar(0.2)
                const earthNightTexture = await loadTexture(Night)
                earthNightTexture.colorSpace = THREE.SRGBColorSpace
                earthNightTexture.anisotropy = 8
                await updateLoadingProgressBar(0.4)
                const earthSpecularCloudsTexture = await loadTexture(Clouds)
                earthSpecularCloudsTexture.anisotropy = 8
                await updateLoadingProgressBar(0.6)

                const envMap = await loadTexture(StarMap)
                envMap.colorSpace = THREE.SRGBColorSpace
                envMap.mapping = THREE.EquirectangularReflectionMapping
                await updateLoadingProgressBar(0.8)
                scene.background = envMap


                const now = new Date();
                const dayOfYear = (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000;
                const declination = 23.44 * Math.cos(((360 / 365) * (dayOfYear + 10)) * (Math.PI / 180));

                const earthTilt = declination * (Math.PI / 180);
                const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
                const sunAngle = (utcHours / 24) * 2 * Math.PI;

                const sunDirection = new THREE.Vector3(
                    -Math.cos(sunAngle),
                    Math.sin(earthTilt),
                    -Math.sin(sunAngle)
                ).normalize()

                this.earthGeometry = new THREE.SphereGeometry(5, 128, 128)
                const earthMaterial = new THREE.ShaderMaterial({
                vertexShader: earthVertexShader,
                fragmentShader: earthFragmentShader,
                uniforms: {
                    uDayTexture: new THREE.Uniform(earthDayTexture),
                    uNightTexture: new THREE.Uniform(earthNightTexture),
                    uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
                    uSunDirection: new THREE.Uniform(sunDirection),
                    uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
                    uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
                }
                })
                const earth = new THREE.Mesh(this.earthGeometry, earthMaterial)
                earth.rotation.z = -(23.5 / 360 * 2 * Math.PI)


                const atmosphereMaterial = new THREE.ShaderMaterial({
                vertexShader: atmosphereVertexShader,
                fragmentShader: atmosphereFragmentShader,
                side: THREE.BackSide,
                transparent: true,
                uniforms: {
                    uSunDirection: new THREE.Uniform(sunDirection),
                    uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
                    uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
                }
                });
                const atmosphere = new THREE.Mesh(this.earthGeometry, atmosphereMaterial);
                atmosphere.scale.set(1.016, 1.016, 1.016)
                scene.add(atmosphere)
                scene.add(earth)

                // Create the satellite mesh
                const satGeometry = new THREE.SphereGeometry(0.3, 16, 16)
                const satMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.8
                })
                this.satMesh = new THREE.Mesh(satGeometry, satMaterial)
                scene.add(this.satMesh)
                
                // Initialize dat.GUI
                this.gui = new dat.GUI();
                this.gui.width = 300;
                
                // Add satellite position folder with better precision
                const satelliteFolder = this.gui.addFolder('Satellite Position');
                
                // Create controllers with proper decimal precision
                const latController = satelliteFolder.add(this.satelliteInfo, 'latitude', -90, 90)
                    .step(0.0001).listen().name('Latitude (°)');
                
                const lonController = satelliteFolder.add(this.satelliteInfo, 'longitude', -180, 180)
                    .step(0.0001).listen().name('Longitude (°)');
                
                const altController = satelliteFolder.add(this.satelliteInfo, 'altitude', 0, 1000)
                    .step(0.01).listen().name('Altitude (km)');
                
                // Format the display to ensure float values
                latController.__precision = 4;
                latController.__impliedStep = 0.0001;
                
                lonController.__precision = 4;
                lonController.__impliedStep = 0.0001;
                
                altController.__precision = 2;
                altController.__impliedStep = 0.01;
                
                satelliteFolder.open();
                
                // Initialize satellite data
                if (vueComponent.items) {
                    const tle1 = vueComponent.items.tle_line1;
                    const tle2 = vueComponent.items.tle_line2;
                    
                    // Store the satellite record for use in updateScene
                    this.satrec = twoline2satrec(tle1, tle2);
                    
                    // Initial position update
                    this.updateSatellitePosition();
                    
                    // Draw the orbital path
                    this.drawOrbitPath(60); // 30 minutes
                }

                // this.debugSun = new THREE.Mesh(
                //   new THREE.SphereGeometry(0.5, 16, 16),
                //   new THREE.MeshBasicMaterial({ color: 0xffff00 })
                // )
                // this.debugSun.position.copy(sunDirection).multiplyScalar(15);
                // scene.add(this.debugSun)

   
                this.stats1 = new Stats()
                this.stats1.showPanel(0) 
                this.stats1.domElement.style.cssText = "position:absolute;top:0px;left:0px;"
                
                this.container.appendChild(this.stats1.domElement)

                // Add graticule
                this.addGraticule();

                await updateLoadingProgressBar(1.0, 100)
            },
            
            // Method to calculate satellite position at a given time
            calculateSatellitePosition(time) {
                if (!this.satrec) return null;
                
                // Get position and velocity
                const positionAndVelocity = propagate(this.satrec, time);
                const positionEci = positionAndVelocity.position;
                
                // Convert to geographic coordinates
                const gmst = gstime(time);
                const positionGd = eciToGeodetic(positionEci, gmst);
                
                // Get latitude and longitude in radians
                const lat = positionGd.latitude;
                // Store original longitude for GUI display
                const originalLon = positionGd.longitude;
                // Negate longitude to flip the direction of movement
                const lon = -originalLon;
                
                // Store raw lat/lon for GUI display (in degrees)
                if (time.getTime() === new Date().getTime()) {
                    this.satelliteInfo.latitude = lat * (180/Math.PI);
                    this.satelliteInfo.longitude = originalLon * (180/Math.PI);
                    this.satelliteInfo.altitude = positionGd.height;
                }
                
                // Convert to Cartesian coordinates
                const cosLat = Math.cos(lat);
                const sinLat = Math.sin(lat);
                const cosLon = Math.cos(lon);
                const sinLon = Math.sin(lon);
                
                // Standard geographic to Cartesian conversion
                const x = this.earthRadius * cosLat * cosLon;
                const z = this.earthRadius * cosLat * sinLon;
                const y = this.earthRadius * sinLat;
                
                // Create position vector
                const position = new THREE.Vector3(x, y, z);
                
                // Add height above Earth's surface
                const heightVector = position.clone().normalize().multiplyScalar(positionGd.height * this.scaleFactor);
                position.add(heightVector);
                
                // Apply Earth's tilt
                const tilt = -(23.5 / 360 * 2 * Math.PI);
                position.applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
                
                return position;
            },
            
            // Method to draw the orbital path
            drawOrbitPath(minutes) {
                if (!this.satrec) return;
                
                // Remove existing orbit line if any
                if (this.orbitLine) {
                    scene.remove(this.orbitLine);
                }
                
                // Create points for the orbit path
                const points = [];
                const currentTime = new Date();
                
                // Calculate orbital period for better sampling
                // Get two positions 1 minute apart
                const pos1 = propagate(this.satrec, currentTime).position;
                const pos2 = propagate(this.satrec, new Date(currentTime.getTime() + 60000)).position;
                
                // Calculate velocity in km/s
                const dx = pos2.x - pos1.x;
                const dy = pos2.y - pos1.y;
                const dz = pos2.z - pos1.z;
                const velocity = Math.sqrt(dx*dx + dy*dy + dz*dz) / 60; // km/s
                
                // Estimate orbital period (circumference / velocity)
                // Circumference = 2πr, where r is distance from Earth's center
                const distance = Math.sqrt(pos1.x*pos1.x + pos1.y*pos1.y + pos1.z*pos1.z); // km
                const circumference = 2 * Math.PI * distance; // km
                const period = circumference / velocity; // seconds
                
                // Use more points for longer time periods
                const numPoints = Math.max(100, Math.min(500, Math.floor(minutes * 60 / period * 100)));
                console.log(`Estimated orbital period: ${period/60} minutes, using ${numPoints} points`);
                
                // Calculate points with adaptive time steps
                for (let i = 0; i < numPoints; i++) {
                    // Calculate time for this point
                    const pointTime = new Date(currentTime.getTime() + (i * minutes * 60 * 1000) / numPoints);
                    
                    // Calculate position at this time
                    const position = this.calculateSatellitePosition(pointTime);
                    if (position) {
                        points.push(position);
                    }
                }
                
                // Create the line geometry
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                
                // Create the line material
                const material = new THREE.LineBasicMaterial({
                    color: 0xffff00,
                    linewidth: 2,
                    transparent: true,
                    opacity: 0.7
                });
                
                // Create the line
                this.orbitLine = new THREE.Line(geometry, material);
                scene.add(this.orbitLine);
                
                // Add a second line to complete the orbit if needed
                if (minutes > period/60) {
                    // Check if first and last points are far apart
                    const firstPoint = points[0];
                    const lastPoint = points[points.length - 1];
                    const distance = firstPoint.distanceTo(lastPoint);
                    
                    if (distance > 0.1) { // If points aren't close, add connecting line
                        const connectPoints = [lastPoint, firstPoint];
                        const connectGeometry = new THREE.BufferGeometry().setFromPoints(connectPoints);
                        const connectLine = new THREE.Line(connectGeometry, material);
                        this.orbitLine.add(connectLine); // Add as child of main line
                    }
                }
            },
            
            // Method to update satellite position
            updateSatellitePosition() {
                if (!this.satrec || !this.satMesh) return;
                
                const currentTime = new Date();
                const position = this.calculateSatellitePosition(currentTime);
                
                if (position) {
                    // Update satellite position
                    this.satMesh.position.copy(position);
                }
            },
            
            updateScene(interval, elapsed) {
                this.controls.update()
                this.stats1.update()
                
                // Update satellite position in each frame
                this.updateSatellitePosition();
            },

            // Method to create graticule
            addGraticule() {
                // Create a group to hold all lines
                const graticuleGroup = new THREE.Group();
                
                // Material for the regular grid lines
                const material = new THREE.LineBasicMaterial({
                    color: 0xFFFFFF,  // White color
                    transparent: true,
                    opacity: 0.2,
                    linewidth: 1
                });
                
                // Material for major lines (every 90 degrees)
                const majorMaterial = new THREE.LineBasicMaterial({
                    color: 0xFFFFFF,  // White color
                    transparent: true,
                    opacity: 0.4,
                    linewidth: 2
                });
                
                // Material for equator and prime meridian
                const equatorMaterial = new THREE.LineBasicMaterial({
                    color: 0x00FF00,  // Green color
                    transparent: true,
                    opacity: 0.8,
                    linewidth: 2
                });
                
                // Draw latitude lines
                for (let lat = -80; lat <= 80; lat += 10) {
                    const points = [];
                    for (let lon = -180; lon <= 180; lon += 5) {
                        const latRad = lat * (Math.PI / 180);
                        const lonRad = lon * (Math.PI / 180);
                        
                        const cosLat = Math.cos(latRad);
                        const sinLat = Math.sin(latRad);
                        const cosLon = Math.cos(lonRad);
                        const sinLon = Math.sin(lonRad);
                        
                        const x = this.earthRadius * cosLat * cosLon;
                        const z = this.earthRadius * cosLat * sinLon;
                        const y = this.earthRadius * sinLat;
                        
                        points.push(new THREE.Vector3(x, y, z));
                    }
                    
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(geometry, Math.abs(lat) % 90 === 0 ? majorMaterial : material);
                    graticuleGroup.add(line);
                }
                
                // Draw longitude lines
                for (let lon = -180; lon <= 180; lon += 10) {
                    const points = [];
                    for (let lat = -90; lat <= 90; lat += 5) {
                        const latRad = lat * (Math.PI / 180);
                        const lonRad = lon * (Math.PI / 180);
                        
                        const cosLat = Math.cos(latRad);
                        const sinLat = Math.sin(latRad);
                        const cosLon = Math.cos(lonRad);
                        const sinLon = Math.sin(lonRad);
                        
                        const x = this.earthRadius * cosLat * cosLon;
                        const z = this.earthRadius * cosLat * sinLon;
                        const y = this.earthRadius * sinLat;
                        
                        points.push(new THREE.Vector3(x, y, z));
                    }
                    
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(geometry, Math.abs(lon) % 90 === 0 ? majorMaterial : material);
                    graticuleGroup.add(line);
                }
                
                // Equator (latitude 0)
                const equatorPoints = [];
                for (let lon = -180; lon <= 180; lon += 5) {
                    const lonRad = lon * (Math.PI / 180);
                    
                    const x = this.earthRadius * Math.cos(lonRad);
                    const z = this.earthRadius * Math.sin(lonRad);
                    const y = 0;
                    
                    equatorPoints.push(new THREE.Vector3(x, y, z));
                }
                const equatorGeometry = new THREE.BufferGeometry().setFromPoints(equatorPoints);
                const equatorLine = new THREE.Line(equatorGeometry, equatorMaterial);
                graticuleGroup.add(equatorLine);
                
                // Prime Meridian (longitude 0)
                const meridianPoints = [];
                for (let lat = -90; lat <= 90; lat += 5) {
                    const latRad = lat * (Math.PI / 180);
                    
                    const x = this.earthRadius * Math.cos(latRad);
                    const z = 0;
                    const y = this.earthRadius * Math.sin(latRad);
                    
                    meridianPoints.push(new THREE.Vector3(x, y, z));
                }
                const meridianGeometry = new THREE.BufferGeometry().setFromPoints(meridianPoints);
                const meridianLine = new THREE.Line(meridianGeometry, equatorMaterial);
                graticuleGroup.add(meridianLine);
                
                // Move the graticule slightly above the Earth's surface
                const offset = 0.01;  // Small offset to prevent z-fighting
                graticuleGroup.scale.set(1 + offset, 1 + offset, 1 + offset);
                
                // Apply Earth's tilt to the graticule
                const tilt = -(23.5 / 360 * 2 * Math.PI);
                graticuleGroup.rotateZ(tilt);
                
                // Add the graticule group to the scene
                scene.add(graticuleGroup);
            }
        }

        runApp(app, scene, renderer, camera, true, undefined, undefined)

    },
    // animate: function() {
    //     requestAnimationFrame(this.animate);
    //     this.mesh.rotation.x += 0.01;
    //     this.mesh.rotation.y += 0.02;
    //     this.renderer.render(this.scene, this.camera);
    // }
  },
  mounted() {
      this.init();
  }
}
</script>

<style scoped>
    html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        position: relative;
      }
      #container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
    }
      #veil {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: black;
        opacity: 1;
        pointer-events: none;
        transition: opacity 1s ease-in-out;
      }
      #progress-bar {
        position: absolute;
        width: 200px;
        height: 5px;
        left: 50vw;
        top: 50vh;
        transition: opacity 0.2s ease;
        transform: translateX(-50%);
        background-color: #333;
      }
      #progress {
        position: absolute;
        width: 0px;
        height: 5px;
        left: 0px;
        top: 0px;
        transition: width 0.2s ease;
        background-color: #848484;
      }

</style>