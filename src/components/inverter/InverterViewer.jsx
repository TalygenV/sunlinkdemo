import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { motion } from 'framer-motion';
import WebGLContextManager from '../../lib/WebGlContextManager';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// Import the inverter model
import inverterModel from '../../products/inverter/enphaseinverter-opt.glb?url';

const InverterViewer = ({
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
  const inverterMeshRef = useRef(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  
  // First phase: Wait for component to mount and stabilize
  useEffect(() => {
    if (mountRef.current) {
      // Give the layout time to fully stabilize
      const timer = setTimeout(() => {
        setInitialized(true);
        
      }, 500); // Delay for stability
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Second phase: Create and maintain the 3D scene after initialization
  useEffect(() => {
    if (!initialized || !mountRef.current) return;
    
    // Only create renderer if we can get a context
    if (!WebGLContextManager.requestContext()) {
      console.log("Too many active WebGL contexts, not initializing new one");
      setRendererReady(true); // Fake it to hide loading indicator
      return () => {}; // Empty cleanup function
    }
    
    // Force fixed dimensions to prevent layout dependency issues
    const width = mountRef.current.clientWidth || 400; // Fallback if clientWidth is 0
    const height = mountRef.current.clientHeight || 400; // Fallback if clientHeight is 0
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
    camera.position.set(0, 0, 2);
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
    controls.autoRotateSpeed = 1.5;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(1.5, 1, 1);
    scene.add(keyLight);
    
    // Subtle purple accent (matching from-purple-400 in the modal)
    const purpleLight = new THREE.DirectionalLight(0xa78bfa, 0.1);
    purpleLight.position.set(1, 1, 5);
    scene.add(purpleLight);
    
    // Subtle blue accent (matching to-blue-500 in the modal)
    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.3);
    fillLight.position.set(-1, 0.5, 1);
    scene.add(fillLight);
    
    // Create an environment map for reflections
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const envMap = cubeTextureLoader.load([
      // Add 6 placeholder colors for the environment map
      createColorDataURL('#333333'), createColorDataURL('#444444'),
      createColorDataURL('#333333'), createColorDataURL('#444444'),
      createColorDataURL('#333333'), createColorDataURL('#444444')
    ]);
    scene.environment = envMap;
    
    // Configure KTX2 compressed texture support (matches BatteryModel setup)
    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.153/examples/jsm/libs/basis/')
      .detectSupport(renderer);
    
    // GLTF loader with KTX2 & Meshopt support
    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);
    
    // Fixed model positioning values
    const MODEL_SCALE = isMobile ? 15.0 : 12.0;
    const Y_POSITION = isMobile ? -1 : -0.5;
    
    loader.load(
      inverterModel,
      (gltf) => {
        const model = gltf.scene;
        
        // Store references
        modelRef.current = model;
        inverterMeshRef.current = model;
        
        // Apply scaling and positioning
        model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
        model.position.set(0, Y_POSITION, 0);
        model.rotation.set(0, Math.PI/2, 0);
        
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
       
        
        // For debug: Output bounding box info without using it for positioning
        const boundingBox = new THREE.Box3().setFromObject(model);
        const modelSize = boundingBox.getSize(new THREE.Vector3());
        const modelCenter = boundingBox.getCenter(new THREE.Vector3());
     
      },
      (xhr) => {
 
      },
      (error) => {
   
      }
    );
    
    // Animation loop - store the ID
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animationFrameId = requestAnimationFrame(animate);
    
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
      
      // Cancel any animation frames
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Remove renderer from DOM
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of controls
      controls.dispose();
      
      // Dispose of environment map if it exists
      if (envMap) {
        envMap.dispose();
      }
      
      // Dispose of KTX2 loader
      if (ktx2Loader) {
        ktx2Loader.dispose();
      }
      
      // Dispose of all materials and geometries in the scene
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      // Dispose of renderer
      renderer.dispose();
      
      // Release the context when done
      WebGLContextManager.releaseContext();
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
  
  // Handle manual rotation
  const handleRotate = (direction) => {
    if (!inverterMeshRef.current) return;
    
    const model = inverterMeshRef.current;
    const rotationAmount = direction === 'left' ? -Math.PI/2 : Math.PI/2;
    const targetRotation = rotationAngle + rotationAmount;
    
    // Animate the rotation
    const startRotation = model.rotation.y;
    const delta = rotationAmount;
    const duration = 500; // ms
    const startTime = Date.now();
    
    const animateRotation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth rotation
      const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const easedProgress = easeInOut(progress);
      
      model.rotation.y = startRotation + delta * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        setRotationAngle(targetRotation);
      }
    };
    
    animateRotation();
  };
  
  // Container styles with explicit dimensions
  const containerStyle = {
    height: `${containerHeight}px`,
    borderRadius: "0",
    border: "none",
    boxShadow: "none",
    overflow: "hidden",
    position: "relative",
    minHeight: "400px", // Ensure minimum height
    minWidth: "400px",  // Ensure minimum width
    ...style
  };
  
  return (
    <div className="h-full" style={{ position: "relative" }}>
      {/* Rotation Arrows */}
      {!isMobile && <div className="absolute inset-y-0 left-0 flex items-center pl-[15%] pt-[20%]">
        <button 
          onClick={() => handleRotate('left')}
          className="text-white/70 hover:text-white transition-colors p-2 focus:outline-none"
          aria-label="Rotate left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>}
      
      {!isMobile && <div className="absolute inset-y-0 right-0 flex items-center pr-[15%] pt-[20%]">
        <button 
          onClick={() => handleRotate('right')}
          className="text-white/70 hover:text-white transition-colors p-2 focus:outline-none"
          aria-label="Rotate right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>}
      
      {/* 3D Viewer */}
      <div
        ref={mountRef}
        style={{
          ...containerStyle, 
          height: isMobile ? "100%" : "120%", 
          position: "relative", 
          zIndex: 1, 
          marginTop: isMobile ? "0" : "-10%"
        }}
        onClick={() => handleRotate('right')}
      />
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full animate-spin mb-3"></div>
            <div className="text-white text-sm">
              {initialized ? 
                (modelLoaded ? 'Setting up 3D viewer...' : 'Loading inverter model...') : 
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

export default InverterViewer;