import * as THREE from "three"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"

global.THREE = THREE

export const getDefaultUniforms = () => {
    return {
        u_time: { value: 0.0 },
        u_mouse: {
            value: {
                x: 0.0,
                y: 0.0
            }
        },
        u_resolution: {
            value: {
                x: window.innerWidth * window.devicePixelRatio,
                y: window.innerHeight * window.devicePixelRatio
            }
        }
    }
}

export const runApp = (app, scene, renderer, camera, enableAnimation = false, uniforms = getDefaultUniforms(), composer = null) => {
    const container = document.getElementById("container")
    container.appendChild(renderer.domElement)

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        if (uniforms.u_resolution !== undefined) {
            uniforms.u_resolution.value.x = window.innerWidth * window.devicePixelRatio
            uniforms.u_resolution.value.y = window.innerHeight * window.devicePixelRatio
        }

        if (typeof app.resize === 'function') {
            app.resize();
        }
    })

    const mouseListener = (e) => {
        uniforms.u_mouse.value.x = e.touches ? e.touches[0].clientX : e.clientX
        uniforms.u_mouse.value.y = e.touches ? e.touches[0].clientY : e.clientY
    }
    if ("ontouchstart" in window) {
        window.addEventListener("touchmove", mouseListener);
    }
    else {
        window.addEventListener("mousemove", mouseListener);
    }

    if (app.updateScene === undefined) {
        app.updateScene = (delta, elapsed) => {};
    }
    Object.assign(app, { ...app, container});

    const clock = new THREE.Clock();
    const animate = () => {
        if (enableAnimation) {
            requestAnimationFrame(animate);
        }

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        uniforms.u_time.value = elapsed;

        app.updateScene(delta, elapsed);

        if (composer === null) {
            renderer.render(scene, camera);
        }
        else {
            composer.render()
        }
    }

    app.initScene()
        .then(() => {
            const veil = document.getElementById("veil")
            veil.style.opacity = 0
            const progressBar = document.getElementById("progress-bar")
            progressBar.style.opacity = 0
            return true
        })
        .then(animate)
        .then(() => {
            renderer.info.reset()
            console.log("Renderer info", renderer.info)
        })
        .catch((error) => {
            console.log(error);
        });
}

export const createRenderer = (rendererProps = {}, configureRenderer = (renderer) => { }) => {
    const renderer = new THREE.WebGLRenderer(rendererProps)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    // renderer.setClearColor('#333333')

    // more configurations to the renderer from the consumer
    configureRenderer(renderer)

    return renderer
}

export const createComposer = (renderer, scene, camera, extraPasses) => {
    const renderScene = new RenderPass(scene, camera)

    let composer = new EffectComposer(renderer)
    composer.addPass(renderScene)


    extraPasses(composer)

    return composer
}

export const createCamera = (
    fov = 45,
    near = 0.1,
    far = 100,
    camPos = { x: 0, y: 0, z: 5 },
    camLookAt = { x: 0, y: 0, z: 0 },
    aspect = window.innerWidth / window.innerHeight,
) => {
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    camera.position.set(camPos.x, camPos.y, camPos.z)
    camera.lookAt(camLookAt.x, camLookAt.y, camLookAt.z) // this only works when there's no OrbitControls
    camera.updateProjectionMatrix()
    return camera
}

export const updateLoadingProgressBar = async (frac, delay=200) => {
    return new Promise(resolve => {
        const progress = document.getElementById("progress")
        // 200px is the width of the progress bar defined in index.html
        progress.style.width = `${frac * 200}px`
        setTimeout(resolve, delay)
    })
}