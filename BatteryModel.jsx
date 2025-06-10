import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { motion } from 'framer-motion';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import WebGLContextManager from '../../lib/WebGlContextManager';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// Import the battery model
import defaultModel from '../../products/batteries/model/tesla_battery-opt-opt-compressed.glb?url';

// Add these constants outside the component for stable lighting
const LIGHTING_PARAMS = {
  ambientIntensity: 0.5,
  blueAccentIntensity: 0.3,
  spotlightIntensity: 1.2,
  frontSpotlightIntensity: 1.2,
  pointLightIntensity: 3.0,
  glowLightIntensity: 2.0
};

// Simplify the teleportation effect parameters
const TELEPORT_EFFECT = {
  dissolveSpeed: 0.8,
  reappearSpeed: 0.7,
  duration: 1000 // ms - shorter total duration
};

// Global offset to fine-tune vertical placement of every battery model
const MODEL_VERTICAL_OFFSET = -1; // move all models 0.5 units downward

const BatteryModel = forwardRef(({
  containerHeight = 500,
  style = {},
  position = 'front', // 'front', 'middle', 'back'
  isInteractive = false,
  onLoadComplete = () => {},
  scale = 1.0,
  rotationY = 0,
  onRotateRequest = null,
  modelFile = defaultModel, // Allow overriding the model via props
  isMobile = false // Add isMobile prop
}, ref) => {
  const mountRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const modelRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const batteryMeshRef = useRef(null);
  
  // Add a ref to track light objects
  const lightsRef = useRef({});
  
  // Add state for teleportation effect
  const particlesRef = useRef(null);
  const composerRef = useRef(null);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const teleportStateRef = useRef({
    phase: 'idle', // 'idle', 'dissolve', 'teleport', 'reappear'
    progress: 0,
    targetRotation: 0,
    startRotation: 0,
    targetOpacity: 1,
    particlesVisible: false
  });
  
  // Expose rotation functions via ref with smoother animation
  useImperativeHandle(ref, () => ({
    rotateModel: (direction) => {
      if (!modelRef.current || isTeleporting) return;
      
      // Start teleportation effect
      setIsTeleporting(true);
      
      const rotationAmount = direction === 'left' ? -Math.PI/2 : Math.PI/2;
      const currentRotation = modelRef.current.rotation.y;
      const targetRotation = currentRotation + rotationAmount;
      
      // Make the model temporarily semi-transparent during rotation
      modelRef.current.traverse(node => {
        if (node.isMesh && node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(mat => {
              if (!mat.transparent) {
                mat.transparent = true;
                mat._originalOpacity = mat.opacity || 1;
              }
              // Reduce opacity but don't make completely invisible
              mat.opacity = 0.3;
            });
          } else {
            if (!node.material.transparent) {
              node.material.transparent = true;
              node.material._originalOpacity = node.material.opacity || 1;
            }
            // Reduce opacity but don't make completely invisible
            node.material.opacity = 0.3;
          }
        }
      });
      
      // Save original position
      const originalZ = modelRef.current.position.z;
      
      // Simple animation sequence
      const duration = TELEPORT_EFFECT.duration;
      const startTime = Date.now();
      const maxZOffset = 3; // Maximum Z offset for orbital motion
      
      const animateRotation = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress >= 1) {
          // Animation complete - restore full opacity and position
          modelRef.current.traverse(node => {
            if (node.isMesh && node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach(mat => {
                  mat.opacity = mat._originalOpacity || 1;
                });
              } else {
                node.material.opacity = node.material._originalOpacity || 1;
              }
            }
          });
          
          // Ensure Z position is back to original
          modelRef.current.position.z = originalZ;
          
          // Clamp rotation so it never grows beyond ±π
          modelRef.current.rotation.y = normalizeAngle(modelRef.current.rotation.y);
          
          // End teleportation state
          setIsTeleporting(false);
          return;
        }
        
        // Easing function for smooth rotation
        const eased = easeInOutCubic(progress);
        
        // Apply rotation
        modelRef.current.rotation.y = currentRotation + (rotationAmount * eased);
        
        // Apply Z-axis offset to create orbital motion
        const zOffset = maxZOffset * Math.sin(progress * Math.PI);
        modelRef.current.position.z = originalZ + zOffset;
        
        // ADDED: Update the position of spotlight targets to follow the model
        // This ensures lights continue illuminating the model correctly
        if (lightsRef.current.spotlight && lightsRef.current.spotlight.target) {
          lightsRef.current.spotlight.target.position.z = zOffset;
        }
        
        if (lightsRef.current.frontSpotlight && lightsRef.current.frontSpotlight.target) {
          lightsRef.current.frontSpotlight.target.position.z = zOffset;
        }
        
        // Continue animation
        requestAnimationFrame(animateRotation);
      };
      
      // Start the animation
      animateRotation();
    }
  }));
  
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
      console.log(position)
      setRendererReady(true); // Fake it to hide loading indicator
      setModelLoaded(true); // Also set model as loaded
      onLoadComplete(); // Call completion callback
      return () => {}; // Empty cleanup function
    }
    
    // Force fixed dimensions to prevent layout dependency issues
    const width = mountRef.current.clientWidth || 400; // Fallback if clientWidth is 0
    const height = mountRef.current.clientHeight || 400; // Fallback if clientHeight is 0
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup with error handling
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        preserveDrawingBuffer: true
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(width, height);
      renderer.setPixelRatio(1.0); // Force 1.0 pixel ratio to fix canvas scaling issues
      
      // Enable shadow mapping on the renderer
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Add context lost handling
      renderer.domElement.addEventListener('webglcontextlost', (event) => {
      
        event.preventDefault();
        setModelLoaded(true);
        onLoadComplete();
      }, false);
      
      mountRef.current.appendChild(renderer.domElement);
    } catch (error) {

      // Fall back to loaded state despite error
      setModelLoaded(true);
      onLoadComplete();
      return; // Exit early
    }
    
    // ------------------------------------------------------------
    // Configure compressed-texture (KTX2/ETC1S) support for GLTF
    // ------------------------------------------------------------
    const ktx2Loader = new KTX2Loader()
      // Basis transcoder files served from a CDN – keep this tiny helper
      .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.153/examples/jsm/libs/basis/')
      .detectSupport(renderer);

    // GLTF loader – wire the ktx2 loader in so mesh textures decode
    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    // ------------------------------------------------------------
    // Controls - only enable if interactive
    // ------------------------------------------------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // Disable user-driven zoom and rotation; we'll rotate programmatically on click instead
    controls.enableZoom = false;        // disable scroll zoom
    controls.enablePan = false;         // keep panning disabled
    controls.autoRotate = autoRotate;   // still allow autorotation if needed
    controls.autoRotateSpeed = 1.5;
    controls.enabled = false;           // disable all pointer interaction
    controls.enableRotate = false;      // ensure drag rotate is off
    
    // Enable rotation only for the front/interactive battery
    controls.enableRotate = isInteractive;
    
    // Add rotation constraints for better user experience
    controls.minPolarAngle = Math.PI * 0.3; // Limit vertical rotation (top)
    controls.maxPolarAngle = Math.PI * 0.7; // Limit vertical rotation (bottom)
    
    // Optional: Add horizontal rotation limits if desired
    // controls.minAzimuthAngle = -Math.PI / 4; // Limit horizontal rotation (left)
    // controls.maxAzimuthAngle = Math.PI / 4;  // Limit horizontal rotation (right)
    
    // Lighting - put all lights in a separate group to keep them fixed in world space
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    
    // Store this group in the ref
    lightsRef.current.group = lightsGroup;
    
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, LIGHTING_PARAMS.ambientIntensity);
    lightsGroup.add(ambientLight);
    lightsRef.current.ambient = ambientLight;
    
    // Subtle blue accent
    const blueLight = new THREE.DirectionalLight(0x3b82f6, LIGHTING_PARAMS.blueAccentIntensity);
    blueLight.position.set(-1, 0.5 + MODEL_VERTICAL_OFFSET, 1);
    lightsGroup.add(blueLight);
    lightsRef.current.blue = blueLight;
    
    // Add spotlight
    const spotlight = new THREE.SpotLight(0xffffff, LIGHTING_PARAMS.spotlightIntensity);
    spotlight.position.set(0, 5 + MODEL_VERTICAL_OFFSET, 3);
    spotlight.angle = Math.PI / 8;
    spotlight.penumbra = 0.3;
    spotlight.decay = 1.5;
    spotlight.distance = 15;
    
    // Better shadow settings
    spotlight.castShadow = true;
    spotlight.shadow.bias = -0.0001;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    spotlight.shadow.camera.near = 0.5;
    spotlight.shadow.camera.far = 20;
    spotlight.shadow.focus = 1;
    
    // Create a fixed target for the spotlight that doesn't move with the model
    const spotlightTarget = new THREE.Object3D();
    spotlightTarget.position.set(0, 0 + MODEL_VERTICAL_OFFSET, 0);
    lightsGroup.add(spotlightTarget);
    spotlight.target = spotlightTarget;
    
    lightsGroup.add(spotlight);
    lightsRef.current.spotlight = spotlight;
    
    // Front battery spotlight ‑ centred and softened to illuminate the whole unit
    const frontBatterySpotlight = new THREE.SpotLight(0xffffff, LIGHTING_PARAMS.frontSpotlightIntensity);
    // Position it farther back and higher up so the beam behaves like a wide flood light
    frontBatterySpotlight.position.set(0.75, 6 + MODEL_VERTICAL_OFFSET, 8);
    
    const frontSpotlightTarget = new THREE.Object3D();
    // Aim roughly at the centre of the battery so light covers the full height/width
    frontSpotlightTarget.position.set(0.75, 0 + MODEL_VERTICAL_OFFSET, 0);
    lightsGroup.add(frontSpotlightTarget);
    frontBatterySpotlight.target = frontSpotlightTarget;
    
    // Widen beam & soften edges so the full battery is uniformly lit
    frontBatterySpotlight.angle = Math.PI / 2.2; // ~82° cone
    frontBatterySpotlight.penumbra = 0.7; // softer edge
    // Lower decay so intensity stays more even over the larger distance
    frontBatterySpotlight.decay = 0.3;
    // Ensure the light actually reaches since we've moved it back
    frontBatterySpotlight.distance = 30;
    
    // Shadow settings for the new spotlight
    frontBatterySpotlight.castShadow = true;
    frontBatterySpotlight.shadow.bias = -0.0001;
    frontBatterySpotlight.shadow.mapSize.width = 1024;
    frontBatterySpotlight.shadow.mapSize.height = 1024;
    frontBatterySpotlight.shadow.camera.near = 0.5;
    frontBatterySpotlight.shadow.camera.far = 20;
    frontBatterySpotlight.shadow.focus = 1;

    lightsGroup.add(frontBatterySpotlight);
    lightsRef.current.frontSpotlight = frontBatterySpotlight;

    // Add a small point light for a visible light source effect
    const frontSpotlightPoint = new THREE.PointLight(0xffffff, LIGHTING_PARAMS.pointLightIntensity);
    frontSpotlightPoint.position.copy(frontBatterySpotlight.position);
    frontSpotlightPoint.distance = 30;
    frontSpotlightPoint.decay = 0.5;
    lightsGroup.add(frontSpotlightPoint);
    lightsRef.current.pointLight = frontSpotlightPoint;
    
    // Add a second, even larger glow light
    const largeGlowLight = new THREE.PointLight(0xffffff, LIGHTING_PARAMS.glowLightIntensity);
    largeGlowLight.position.copy(frontBatterySpotlight.position);
    largeGlowLight.distance = 50;
    largeGlowLight.decay = 0.3;
    lightsGroup.add(largeGlowLight);
    lightsRef.current.glowLight = largeGlowLight;
    
    // Create an environment map for reflections
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const envMap = cubeTextureLoader.load([
      // Add 6 placeholder colors for the environment map
      createColorDataURL('#333333'), createColorDataURL('#444444'),
      createColorDataURL('#333333'), createColorDataURL('#444444'),
      createColorDataURL('#333333'), createColorDataURL('#444444')
    ]);
    scene.environment = envMap;
    
    // Load the model
    loader.load(
      modelFile,
      (gltf) => {
        const model = gltf.scene;
        
        // Store references
        modelRef.current = model;
        batteryMeshRef.current = model;
        
        // --- Normalize model to a common size so every battery starts consistent ---
        const boundingBox = new THREE.Box3().setFromObject(model);
        const size = boundingBox.getSize(new THREE.Vector3());

        // Debug log to see what's happening with the SolarEdge model
        if (modelFile.includes('solar_edge')) {
          console.log('SolarEdge model loaded:', model);
          console.log('SolarEdge model size:', size);
          console.log('SolarEdge model position:', model.position);
        } else {
          console.log('Normal model loaded:', model);
        }

        // Decide which axis represents the "height". Some models (e.g., SolarEdge) may lie on
        // their side, giving size.y almost-zero. If that happens we instead use the largest
        // dimension to normalise.
        const TARGET_SIZE = 1; // world units
        let reference = size.y;

        // If Y is very small (<20 % of the largest dimension) treat model as lying down.
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (reference === 0 || reference / maxDimension < 0.2) {
          reference = maxDimension;
          if (modelFile.includes('solar_edge')) {
            console.log('SolarEdge model is lying down, using maxDimension:', maxDimension);
          }
        }

        if (reference > 0) {
          let normalizationFactor = TARGET_SIZE / reference;
          // Ensure that the normalization factor isn't excessively small or zero
          if (normalizationFactor < 0.001) {
            normalizationFactor = 0.001; // Apply a minimum scaling factor
          }
          model.scale.multiplyScalar(normalizationFactor);
          
          if (modelFile.includes('solar_edge')) {
            console.log('SolarEdge normalization factor:', normalizationFactor);
            console.log('SolarEdge model scale after normalization:', model.scale);
          }
        }

        // Initial positioning will be applied here (this includes our 3× front scale etc.)
        updateModelProperties(position, scale, rotationY);
        
        // Enhance all materials
        model.traverse((node) => {
          if (node.isMesh && node.material) {
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            
            materials.forEach(material => {
              // Tweaked values for a matte metallic finish
              material.metalness = 0.9;   // Keep the surface metallic
              material.roughness = 0.65;  // Increase roughness for a more matte look
              material.envMap = envMap;  // Ensure reflections still work albeit subdued
              material.envMapIntensity = 0.4;  // Reduce reflection intensity to avoid a plasticky shine
              
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
        
        // For SolarEdge, ensure it's visible by setting material properties
        if (modelFile.includes('solar_edge')) {
          model.traverse((node) => {
            if (node.isMesh && node.material) {
              const materials = Array.isArray(node.material) ? node.material : [node.material];
              materials.forEach(material => {
                // Ensure material is visible
                material.transparent = true;
                material.opacity = 1.0;
                material.visible = true;
                material.needsUpdate = true;
                
                console.log('SolarEdge material:', material);
              });
            }
          });
        }
        
        setModelLoaded(true);
        onLoadComplete();
  
        // Re-aim the front spotlight at this model's centre so every battery is lit evenly
        if (lightsRef.current?.frontSpotlight?.target) {
          lightsRef.current.frontSpotlight.target.position.copy(model.position);
        }
        
        // For SolarEdge, log the model's position and rotation after it's added to the scene
        if (modelFile.includes('solar_edge')) {
          console.log('SolarEdge model added to scene');
          console.log('Position:', model.position);
          console.log('Rotation:', model.rotation);
          console.log('Scale:', model.scale);
        }

        // For debug: log the final size after normalization (optional)
        // const finalBox = new THREE.Box3().setFromObject(model);
        // console.log('Normalized model size:', finalBox.getSize(new THREE.Vector3()));
      },
      (xhr) => {
    
      },
      (error) => {
   
        // Try to complete loading anyway to prevent endless loading state
        setModelLoaded(true);
        onLoadComplete();
     
      }
    );
    
    // Animation state for smooth transitions
    const animationState = {
      isAnimating: false,
      startTime: 0,
      duration: 700, // balanced duration for control
      startScale: { x: 1, y: 1, z: 1 },
      targetScale: { x: 1, y: 1, z: 1 },
      startPosition: { x: 0, y: 0, z: 0 },
      targetPosition: { x: 0, y: 0, z: 0 },
      startRotation: { y: 0 },
      targetRotation: { y: 0 }
    };
    
    // Store animation state with the ref
    mountRef.current.animationState = animationState;
    
    // Helper function to update model properties with animation
    function updateModelProperties(currentPosition, currentScale, currentRotation) {
      if (!modelRef.current) return;
      
      // Calculate target values
      let MODEL_SCALE = 3.0 * currentScale;
      let Y_POSITION = 0;
      let X_POSITION = 0;
      let Z_POSITION = 0;
      
      // Adjust scale and position based on position prop
      if (currentPosition === 'front') {
        Z_POSITION = 1;
        X_POSITION = isMobile ? -1.5 : 0; // Conditional X_POSITION
        Y_POSITION = -0.5;
      } else if (currentPosition === 'middle') {
        MODEL_SCALE *= 0.7;
        Y_POSITION = 3;
        Z_POSITION = -1;
      } else if (currentPosition === 'back') {
        MODEL_SCALE *= 0.4;
        Y_POSITION = 2;
        Z_POSITION = -3;
      } else if (currentPosition === 'far-back') {
        // One step farther and smaller than "back"
        MODEL_SCALE *= 0.25;
        Y_POSITION = 0.5; // Adjusted Y_POSITION for far-back
        Z_POSITION = -5;
      }
      
      // Apply global vertical offset
      Y_POSITION += MODEL_VERTICAL_OFFSET;
      
      // Set up animation parameters
      animationState.isAnimating = true;
      animationState.startTime = performance.now();
      
      // Store current values as starting points
      if (modelRef.current) {
        animationState.startScale = {
          x: modelRef.current.scale.x,
          y: modelRef.current.scale.y,
          z: modelRef.current.scale.z
        };
        animationState.startPosition = {
          x: modelRef.current.position.x,
          y: modelRef.current.position.y,
          z: modelRef.current.position.z || 0
        };
        animationState.startRotation = {
          y: modelRef.current.rotation.y
        };
      }
      
      // Set target values
      animationState.targetScale = {
        x: MODEL_SCALE,
        y: MODEL_SCALE,
        z: MODEL_SCALE
      };
      animationState.targetPosition = {
        x: X_POSITION,
        y: Y_POSITION,
        z: Z_POSITION
      };
      // Choose the shortest angular path back to the requested rotation
      const currentY = normalizeAngle(modelRef.current.rotation.y);
      let targetY = normalizeAngle(currentRotation);
      let delta = targetY - currentY;
      if (delta > Math.PI) {
        targetY -= Math.PI * 2;
      } else if (delta < -Math.PI) {
        targetY += Math.PI * 2;
      }

      animationState.targetRotation = {
        y: targetY
      };
    }
    
    // Store the function reference
    mountRef.current.updateModelProperties = updateModelProperties;
    
    // Initial update with current values (immediate, no animation)
    if (modelRef.current) {
      // Calculate initial values
      let MODEL_SCALE = 3.0 * scale;
      let Y_POSITION = 0;
      let X_POSITION = 0;
      let Z_POSITION = 0;
      
      if (position === 'front') {
        Z_POSITION = 1; // Slightly forward
        X_POSITION = isMobile ? -1.5 : 0;  // Conditional X_POSITION
        Y_POSITION = -0.5;
      } else if (position === 'middle') {
        MODEL_SCALE *= 0.7;
        Y_POSITION = 3;
        Z_POSITION = -1;
      } else if (position === 'back') {
        MODEL_SCALE *= 0.4;
        Y_POSITION = 2;
        Z_POSITION = -3;
      } else if (position === 'far-back') {
        MODEL_SCALE *= 0.25;
        Y_POSITION = 0.5; // Adjusted Y_POSITION for far-back
        Z_POSITION = -5;
      }
      
      // Apply global vertical offset
      Y_POSITION += MODEL_VERTICAL_OFFSET;
      
      // Clamp the initial rotation too
      modelRef.current.rotation.set(0, normalizeAngle(rotationY), 0);
      
      // Apply immediately for initial setup
      modelRef.current.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      modelRef.current.position.set(X_POSITION, Y_POSITION, Z_POSITION);
      
      // Initialize animation state to match current state
      animationState.startScale = animationState.targetScale = {
        x: MODEL_SCALE, y: MODEL_SCALE, z: MODEL_SCALE
      };
      animationState.startPosition = animationState.targetPosition = {
        x: X_POSITION, y: Y_POSITION, z: Z_POSITION
      };
      animationState.startRotation = animationState.targetRotation = {
        y: normalizeAngle(rotationY)
      };
    }
    
    // Animation loop with improved, controlled animation
    let animationFrameId;
    
    const animate = () => {
      // Store the ID from requestAnimationFrame
      animationFrameId = requestAnimationFrame(animate);
      
      try {
        // Handle property animations with controlled motion
        if (animationState.isAnimating && modelRef.current) {
          const currentTime = performance.now();
          const elapsed = currentTime - animationState.startTime;
          const progress = Math.min(elapsed / animationState.duration, 1);
          
          // Use cubic easing for better control
          const eased = easeInOutCubic(progress);
          
          // Interpolate scale with controlled timing
          modelRef.current.scale.x = lerp(
            animationState.startScale.x, 
            animationState.targetScale.x, 
            eased
          );
          modelRef.current.scale.y = lerp(
            animationState.startScale.y, 
            animationState.targetScale.y, 
            eased
          );
          modelRef.current.scale.z = lerp(
            animationState.startScale.z, 
            animationState.targetScale.z, 
            eased
          );
          
          // Interpolate position - ensure controlled path to prevent intersections
          modelRef.current.position.x = lerp(
            animationState.startPosition.x || 0, 
            animationState.targetPosition.x || 0, 
            eased
          );
          modelRef.current.position.y = lerp(
            animationState.startPosition.y || 0, 
            animationState.targetPosition.y || 0, 
            eased
          );
          modelRef.current.position.z = lerp(
            animationState.startPosition.z || 0, 
            animationState.targetPosition.z || 0, 
            eased
          );
          
          // Interpolate rotation
          modelRef.current.rotation.y = lerp(
            animationState.startRotation.y, 
            animationState.targetRotation.y, 
            eased
          );
          
          // Check if animation completed
          if (progress >= 1) {
            animationState.isAnimating = false;
          }
        }
        
        controls.update();
        renderer.render(scene, camera);
      } catch (error) {
        // Don't let errors in the animation loop break everything
        setModelLoaded(true);
        onLoadComplete();
      }
    };
    
    // Helper functions for animation
    function lerp(start, end, t) {
      return start * (1 - t) + end * t;
    }
    
    // Better controlled easing function
    function easeInOutCubic(t) {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    try {
      animate();
    } catch (error) {
      setModelLoaded(true);
      onLoadComplete();
    }
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
      
      // Dispose of composer if it exists
      if (composerRef.current) {
        composerRef.current.dispose();
      }
      
      // Remove renderer from DOM
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of controls
      controls.dispose();
      
      // Dispose of environment map
      if (scene.environment) {
        scene.environment.dispose();
      }
      
      // Dispose all lights
      Object.values(lightsRef.current).forEach(light => {
        if (light && light.dispose) {
          light.dispose();
        }
      });
      
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
      
      // Dispose of KTX2 loader once viewer unmounts
      if (ktx2Loader) {
        ktx2Loader.dispose();
      }
    };
  }, [initialized]); // Only depend on initialized
  
  // Separate effect to update model properties when relevant props change
  useEffect(() => {
    if (mountRef.current && mountRef.current.updateModelProperties) {
      // Pass the current values to the function
      mountRef.current.updateModelProperties(position, scale, rotationY);
    }
  }, [position, scale, rotationY]);
  
  // Update auto-rotation state
  useEffect(() => {
    const controls = mountRef.current?.sceneRef?.controls;
    if (controls) {
      controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);
  
  // Update interactive state 
  useEffect(() => {
    const controls = mountRef.current?.sceneRef?.controls;
    if (controls) {
      controls.enableZoom = false;
      controls.enabled = false;
      controls.enableRotate = false;
    }
  }, [isInteractive]);
  
  // Loading state
  const isLoading = !rendererReady || !modelLoaded;
  
  // Container styles with explicit dimensions
  const containerStyle = {
    height: `${containerHeight}px`,
    borderRadius: "0",
    border: "none",
    boxShadow: "none",
    overflow: "visible",
    position: "relative",
    minHeight: "100dvh", // Ensure minimum height
    minWidth: "800px",  // Ensure minimum width
    width: "100%",
    ...style
  };
  
  // Handle click on the model to trigger rotation
  const handleModelClick = () => {
    if (position === 'front' && onRotateRequest) {
      // Rotate to the right (clockwise)
      const direction = 'right'; 
      if (ref.current) {
        ref.current.rotateModel(direction);
      }
      // Still notify parent component about rotation if needed
      onRotateRequest(direction);
    }
  };
  
  // Replace the complex startTeleportEffect function with a simpler version
  const startTeleportEffect = () => {
    // We'll use a simplified effect that ensures the model stays visible
    console.log("Teleport effect started");
    
    // Add some glow to the model during teleportation
    const addGlowEffect = () => {
      if (!lightsRef.current) return;
      
      // Boost light intensity temporarily for a "glow" effect
      if (lightsRef.current.ambient) {
        lightsRef.current.ambient.intensity = LIGHTING_PARAMS.ambientIntensity * 2;
      }
      
      if (lightsRef.current.blue) {
        lightsRef.current.blue.intensity = LIGHTING_PARAMS.blueAccentIntensity * 3;
      }
      
      // Restore normal lighting after animation completes
      setTimeout(() => {
        if (lightsRef.current.ambient) {
          lightsRef.current.ambient.intensity = LIGHTING_PARAMS.ambientIntensity;
        }
        
        if (lightsRef.current.blue) {
          lightsRef.current.blue.intensity = LIGHTING_PARAMS.blueAccentIntensity;
        }
      }, TELEPORT_EFFECT.duration);
    };
    
    addGlowEffect();
  };
  
  return (
    <div className="h-full" style={{ position: "relative", overflow: "visible" }}>
      {/* 3D Viewer - add onClick handler */}
      <div
        ref={mountRef}
        style={{
          ...containerStyle, 
          height: "100%", 
          position: "relative", 
         
           
          marginTop: "-8dvh",
          cursor: position === 'front' ? 'pointer' : 'default'
        }}
        onClick={handleModelClick}
      />
      
      {/* Loading Indicator */}
      
    </div>
  );
});

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

// Utility to keep angles within [-π, π] so we never build up multiple turns
function normalizeAngle(rad) {
  const twoPi = Math.PI * 2;
  let a = rad % twoPi;
  if (a > Math.PI) a -= twoPi;
  if (a < -Math.PI) a += twoPi;
  return a;
}

export default BatteryModel;