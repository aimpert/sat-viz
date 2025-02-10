import { createApp } from 'vue'
import App from './App.vue'
import { World } from "./world/world.js"

function main() {
    const container = document.querySelector("#scene-container");

    const world = new World(container);

    world.start();
}

main();

createApp(App).mount('#app')
