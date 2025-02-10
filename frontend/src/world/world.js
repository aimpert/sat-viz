import { createCamera } from "./components/camera.js";
import { createLights } from "./components/lights.js";
import { createScene } from "./components/scene.js";
import { createControls } from "./systems/controls.js";
import { createRenderer } from "./systems/renderer.js";
import { Loop } from "./systems/loop.js";
import { Resizer } from "./systems/resizer.js";
import { createEarth } from "./components/objects/earth.js";

let camera;
let renderer;
let scene;
let loop;
let color = "#42b883";

class World {
    constructor(container) {
        camera = createCamera();
        scene = createScene("blue");
        renderer = createRenderer();

        loop = new Loop(camera, scene, renderer);
        container.append(renderer.domElement);
        const { light} = createLights("white");
        loop.updatables.push(light);
        scene.add(light);

        const controls = createControls(camera, renderer.domElement);

        const resizer = new Resizer(container, camera, renderer);
        resizer.onResize = () => {
            this.render();
        };

        let earth = createEarth({
            color: color,
        });

        loop.updatables.push(controls);
        loop.updatables.push(light);
        loop.updatables.push(earth);

        scene.add(light, earth);
    }
    render() {
        renderer.render(scene, camera);
    }
    start() {
        loop.start();
    }
    stop() {
        loop.stop();
    }

}

export { World };