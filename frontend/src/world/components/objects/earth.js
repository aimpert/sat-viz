import {
    SphereGeometry,
    MeshStandardMaterial,
    Mesh,
    // TextureLoader
   } from "three";
    
   export default function createEarth(props) {
    // const loader = new TextureLoader();
    // const height = loader.load("textures/height.png");

    const geometry = new SphereGeometry(15, 32, 16);
    
    const material = new MeshStandardMaterial({
        color: props.color,
        flatShading: true,
        displacementScale: 5,
      });
    
    
    
    const plane = new Mesh(geometry, material);
    plane.position.set(0, 0, 0);
    plane.rotation.x -= Math.PI * 0.35;
    
    //let frame = 0;
    plane.tick = () => {
    
    };
    
    return plane;
   }

export { createEarth };