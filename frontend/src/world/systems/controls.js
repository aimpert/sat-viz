import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MathUtils } from "three";

function createControls(camera, canvas) {
    const controls = new OrbitControls(camera, canvas);

    controls.enabled = true;
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 0.2;

    controls.minPolarAngle = MathUtils.degToRad(40);
    controls.maxPolarAngle = MathUtils.degToRad(75);

    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.enablePan = true;

    controls.tick = () => controls.update();

    return controls;
}

export { createControls };