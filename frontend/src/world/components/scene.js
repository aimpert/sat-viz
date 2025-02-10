import { Color, Scene, CubeTextureLoader } from 'three';

function createScene(color) {
    const scene = new Scene();


    // loader.setPath( "textures/" );
    
    scene.background = new Color(color);
    const loader = new CubeTextureLoader();
    const textureCube = loader.load([
        'textures/stars.jpg', 'textures/stars.jpg',
        'textures/stars.jpg', 'textures/stars.jpg',
        'textures/stars.jpg', 'textures/stars.jpg'
    ]);
    scene.background = textureCube;
    
    //const material = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: textureCube } );

    return scene;
}

export { createScene };