import { createApp } from 'vue'
import App from './App.vue'

import * as THREE from "three"
import * as dat from 'dat.gui'
import Stats from "three/examples/jsm/libs/stats.module"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

// Core boilerplate code deps
import { createCamera, createRenderer, runApp, updateLoadingProgressBar } from "./three/core-utils"

// Other deps
import { loadTexture } from "./three/common-utils"
import Day from "./assets/day.jpg"
import Clouds from "./assets/specularClouds.jpg"
import Night from "./assets/night.jpg"
import StarMap from "./assets/starmap.png"
import earthVertexShader from "./shaders/earth/vertex.glsl"
import earthFragmentShader from "./shaders/earth/fragment.glsl"
import atmosphereVertexShader from "./shaders/atmosphere/vertex.glsl"
import atmosphereFragmentShader from "./shaders/atmosphere/fragment.glsl"

global.THREE = THREE
// previously this feature is .legacyMode = false, see https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
// turning this on has the benefit of doing certain automatic conversions (for hexadecimal and CSS colors from sRGB to linear-sRGB)
THREE.ColorManagement.enabled = true

/**************************************************
 * 0. Tweakable parameters for the scene
 *************************************************/



/**************************************************
 * 1. Initialize core threejs components
 *************************************************/
// Create the scene
let scene = new THREE.Scene()

// Create the renderer via 'createRenderer',
// 1st param receives additional WebGLRenderer properties
// 2nd param receives a custom callback to further configure the renderer
let renderer = createRenderer({ antialias: true }, (_renderer) => {
  // best practice: ensure output colorspace is in sRGB, see Color Management documentation:
  // https://threejs.org/docs/#manual/en/introduction/Color-management
  _renderer.outputColorSpace = THREE.SRGBColorSpace
})

// Create the camera
// Pass in fov, near, far and camera position respectively
let camera = createCamera(45, 1, 1000, { x: 0, y: 0, z: 20 })


/**************************************************
 * 2. Build your scene in this threejs app
 * This app object needs to consist of at least the async initScene() function (it is async so the animate function can wait for initScene() to finish before being called)
 * initScene() is called after a basic threejs environment has been set up, you can add objects/lighting to you scene in initScene()
 * if your app needs to animate things(i.e. not static), include a updateScene(interval, elapsed) function in the app as well
 *************************************************/
let app = {
  async initScene() {
    // OrbitControls
    this.controls = new OrbitControls(camera, renderer.domElement)
    this.controls.enableDamping = true

    // adding a virtual sun using directional light
    // this.dirLight = new THREE.DirectionalLight(0xffffff, params.sunIntensity)
    // this.dirLight.position.set(-50, 0, 30)
    // scene.add(this.dirLight)

    const earthParameters = {}
    earthParameters.atmosphereDayColor = '#00aaff'
    earthParameters.atmosphereTwilightColor = '#ff6600'
    //earthParameters.atmosphereTwilightColor = '#00aaff'

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
    // const rightnow = new Date();
    // const rotation = (2 * Math.PI) / 86164;
    // this.earth.rotation.y += rotation * (rightnow - this.startTime) / 1000;

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



    // this.debugSun = new THREE.Mesh(
    //   new THREE.SphereGeometry(0.5, 16, 16),
    //   new THREE.MeshBasicMaterial({ color: 0xffff00 })
    // )
    // this.debugSun.position.copy(sunDirection).multiplyScalar(15);
    // scene.add(this.debugSun)

    // Stats - show fps
    this.stats1 = new Stats()
    this.stats1.showPanel(0) // Panel 0 = fps
    this.stats1.domElement.style.cssText = "position:absolute;top:0px;left:0px;"
    // this.container is the parent DOM element of the threejs canvas element
    this.container.appendChild(this.stats1.domElement)

    await updateLoadingProgressBar(1.0, 100)
  },
  // @param {number} interval - time elapsed between 2 frames
  // @param {number} elapsed - total time elapsed since app start
  updateScene(interval, elapsed) {
    this.controls.update()
    this.stats1.update()
    // const now = new Date();
    // const rotation = (2 * Math.PI) / 86164;
    // this.earth.rotateY(rotation * (now - this.startTime) / 1000);
    // this.startTime = now;
    // this.earth.rotateY(interval * 0.005 * params.speedFactor)
    // use rotateY instead of rotation.y so as to rotate by axis Y local to each mesh
    // this.earth.rotateY(interval * 0.005 * params.speedFactor)
    // this.clouds.rotateY(interval * 0.01 * params.speedFactor)

  }
}

/**************************************************
 * 3. Run the app
 * 'runApp' will do most of the boilerplate setup code for you:
 * e.g. HTML container, window resize listener, mouse move/touch listener for shader uniforms, THREE.Clock() for animation
 * Executing this line puts everything together and runs the app
 * ps. if you don't use custom shaders, pass undefined to the 'uniforms'(2nd-last) param
 * ps. if you don't use post-processing, pass undefined to the 'composer'(last) param
 *************************************************/
runApp(app, scene, renderer, camera, true, undefined, undefined)


createApp(App).mount('#app')
