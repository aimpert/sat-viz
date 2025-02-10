import { PerspectiveCamera } from "three";

function createCamera() {
    const camera = new PerspectiveCamera(
        100, // FOV
        1, // Aspect ratio
        0.1, // Near clipping plane
        100 // Far clipping plane
    );

    camera.position.set(0, 0, 10);
    camera.tick = () => {

    };

    return camera;
}

export { createCamera }