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

export default {
  name: 'ThreeScene',
  data() {
    return {
      camera: null,
      scene: null,
      renderer: null,
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


        let camera = createCamera(45, 1, 1000, { x: 0, y: 0, z: 20 })

        let app = {
            async initScene() {

                this.controls = new OrbitControls(camera, renderer.domElement)
                this.controls.enableDamping = true

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


                // sat
                const satGeometry = new THREE.SphereGeometry(0.1, 16, 16)
                const satMaterial = new THREE.MeshBasicMaterial({color: 0xff0000})
                const satMesh = new THREE.Mesh(satGeometry, satMaterial)
                satMesh.position.set(10, 10, 10)
                scene.add(satMesh)

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

                await updateLoadingProgressBar(1.0, 100)
            },
            updateScene(interval, elapsed) {
                this.controls.update()
                this.stats1.update()
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