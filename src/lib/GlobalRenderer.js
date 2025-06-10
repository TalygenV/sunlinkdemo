import * as THREE from 'three';

class GlobalRenderer {
  constructor() {
    this.renderer = null;
    this.activeScenes = 0;
    this.renderQueue = [];
  }

  getRenderer() {
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        preserveDrawingBuffer: false
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setPixelRatio(1.0);
    }
    this.activeScenes++;
    return this.renderer;
  }

  releaseRenderer() {
    this.activeScenes--;
    if (this.activeScenes <= 0) {
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer = null;
      }
      this.activeScenes = 0;
    }
  }
}

export default new GlobalRenderer();