import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { motion } from 'framer-motion';

// Import all needed assets directly - Vite needs explicit imports
import modelFile from '../../products/batteries/model/tesla_battery.glb?url';

// Import the texture files
import materialBaseColor from '../../products/batteries/model/textures/material_baseColor.jpeg?url';
import colorM00BaseColor from '../../products/batteries/model/textures/Color_M00_baseColor.jpeg?url';

// If you have textures, import them too:
// import texture1 from '../../products/batteries/model/textures/texture1.png';
// etc.

const BatteryViewer = ({
  containerHeight = 500,
  style = {},
  isMobile = false
}) => {
  const mountRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rendererReady, setRendererReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const modelRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const batteryMeshRef = useRef(null);
  
  // First phase: Wait for component to mount and stabilize
  useEffect(() => {
    if (mountRef.current) {
      // Give the layout time to fully stabilize
      const timer = setTimeout(() => {
        setInitialized(true);
        console.log('BatteryViewer initialization triggered');
      }, 500); // Increased delay for more stability
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Second phase: Create and maintain the 3D scene after initialization
  useEffect(() => {
    if (!initialized || !mountRef.current) return;
    
    console.log('Starting 3D scene setup');
    console.log('Container dimensions:', mountRef.current.clientWidth, mountRef.current.clientHeight);
    
    // Force fixed dimensions to prevent layout dependency issues
    const width = mountRef.current.clientWidth || 400; // Fallback if clientWidth is 0
    const height = mountRef.current.clientHeight || 400; // Fallback if clientHeight is 0
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(1.0);
    mountRef.current.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(1.5, 1, 1);
    scene.add(keyLight);
    const purpleLight = new THREE.DirectionalLight(0xa78bfa, 0.1);
    purpleLight.position.set(1, 1, 5);
    
    scene.add(purpleLight);
    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.3);
    fillLight.position.set(-1, 0.5, 1);
    scene.add(fillLight);
    
    // Preload textures
    const textureLoader = new THREE.TextureLoader();
    const textures = {
      material: textureLoader.load(materialBaseColor, (texture) => {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
      }),
      colorM00: textureLoader.load(colorM00BaseColor, (texture) => {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
      })
    };
    
    // Configure GLTFLoader
    const loader = new GLTFLoader();
    const modelPath = modelFile.substring(0, modelFile.lastIndexOf('/') + 1);
    loader.resourcePath = modelPath;
    
    // Override texture loading
    const originalLoadTexture = loader.manager.getHandler('texture');
    loader.manager.addHandler(/\.jpe?g$/i, {
      load: (url, onLoad) => {
        const filename = url.split('/').pop();
        
        if (filename === 'material_baseColor.jpeg') {
          onLoad(textures.material);
          return textures.material;
        } 
        else if (filename === 'Color_M00_baseColor.jpeg') {
          onLoad(textures.colorM00);
          return textures.colorM00;
        }
        
        return originalLoadTexture.load(url, onLoad);
      }
    });
    
    // Fixed model positioning values based on testing
    const MODEL_SCALE = 3.7;
    const Y_POSITION = 0; // Adjusted higher position
    
    // Load the model
    loader.load(
      modelFile,
      (gltf) => {
        const model = gltf.scene;
        
        // Store references
        modelRef.current = model;
        batteryMeshRef.current = model;
        
        // Apply fixed scaling and positioning instead of bounding box calculations
        model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
        
        // Use fixed positioning instead of bounding box calculations
        model.position.set(0, Y_POSITION, 0);
        model.rotation.set(0, Math.PI/2, 0);
        
        // Create an environment map for reflections
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const envMap = cubeTextureLoader.load([
          // Add 6 placeholder colors for the environment map
          // You can replace these with actual environment textures if available
          createColorDataURL('#333333'), createColorDataURL('#444444'),
          createColorDataURL('#333333'), createColorDataURL('#444444'),
          createColorDataURL('#333333'), createColorDataURL('#444444')
        ]);
        scene.environment = envMap;
        
        // Enhance all materials
        model.traverse((node) => {
          if (node.isMesh && node.material) {
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            
            materials.forEach(material => {
              // Increase reflectivity
              material.metalness = 0.7;  // Higher metalness (0-1)
              material.roughness = 0.2;  // Lower roughness for more reflection (0-1)
              material.envMap = envMap;  // Add environment map for reflections
              material.envMapIntensity = 1.0;  // Control reflection intensity
              
              if (material.map) {
                material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                material.map.minFilter = THREE.LinearFilter;
                material.map.magFilter = THREE.LinearFilter;
                material.map.needsUpdate = true;
              }
            });
          }
        });
        
        // Add the model to the scene
        scene.add(model);
        setModelLoaded(true);
        console.log('Model loaded with fixed positioning:', Y_POSITION);
        
        // For debug: Output bounding box info without using it for positioning
        const boundingBox = new THREE.Box3().setFromObject(model);
        const modelSize = boundingBox.getSize(new THREE.Vector3());
        const modelCenter = boundingBox.getCenter(new THREE.Vector3());
        console.log('Model dimensions (for reference only):', modelSize);
        console.log('Model center (for reference only):', modelCenter);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Responsive resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth || 400;
      const height = mountRef.current.clientHeight || 400;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Save references
    const sceneRef = {
      renderer,
      controls,
      scene,
      camera
    };
    
    mountRef.current.sceneRef = sceneRef;
    setRendererReady(true);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      
      if (modelRef.current) {
        modelRef.current.traverse((node) => {
          if (node.isMesh) {
            node.geometry.dispose();
            if (node.material.isMaterial) {
              node.material.dispose();
            } else {
              for (const material of node.material) {
                material.dispose();
              }
            }
          }
        });
      }
      
      textures.material.dispose();
      textures.colorM00.dispose();
    };
  }, [initialized, autoRotate]);
  
  // Update auto-rotation state
  useEffect(() => {
    const controls = mountRef.current?.sceneRef?.controls;
    if (controls) {
      controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);
  
  // Loading state
  const isLoading = !rendererReady || !modelLoaded;

  // Container styles with explicit dimensions
  const containerStyle = {
    height: `${containerHeight}px`,
    borderRadius: "0",
    border: "none",
    boxShadow: "none",
    overflow: "hidden",
    position: "relative",
    minHeight: isMobile ? "300px" : "400px", // Adjust minimum height for mobile
    minWidth: isMobile ? "300px" : "400px",  // Adjust minimum width for mobile
    ...style
  };

  return (
    <div className="h-full" style={{ position: "relative" }}>
      {/* 3D Viewer */}
      <div
        ref={mountRef}
        style={{
          ...containerStyle,  
          height: isMobile ? "100%" : "100%",
          marginTop: isMobile ? "0" : "0"
        }}
      />
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full animate-spin mb-3"></div>
            <div className="text-white text-sm">
              {initialized ? 
                (modelLoaded ? 'Setting up 3D viewer...' : 'Loading battery model...') : 
                'Preparing viewer...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to create color data URLs for the environment map
function createColorDataURL(hexColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, 2, 2);
  return canvas.toDataURL();
}

export default BatteryViewer;