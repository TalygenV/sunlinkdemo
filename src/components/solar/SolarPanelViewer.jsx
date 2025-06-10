import React, { useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { motion, AnimatePresence } from 'framer-motion';
import WebGLContextManager from '../../lib/WebGlContextManager';

// Import all panel images
import lgFront from '../../images/solar_panels/lg-front.png';
import lgBack from '../../images/solar_panels/lg-rear.png';
import pureFront from '../../images/solar_panels/pure-front.png';
import pureBack from '../../images/solar_panels/pure-back.png';
import urecoFront from '../../images/solar_panels/ureco-front.png';
import urecoBack from '../../images/solar_panels/ureco-rear.png';

// Panel texture maps by panel type
const PANEL_TEXTURES = {
  'LG NeON H+': {
    front: lgFront,
    back: lgBack
  },
  'REC Alpha Pure-R': {
    front: pureFront,
    back: pureBack
  },
  'Ureco 400': {
    front: urecoFront,
    back: urecoBack
  }
};

// Always use the Ureco 400 panel textures
const DEFAULT_PANEL_TEXTURES = {
  front: urecoFront,
  back: urecoBack
};

const SolarPanelViewer = forwardRef(({
  selectedPanel,
  panelOptions = [],
  onSelectPanel,
  containerHeight = 500,
  style = {},
  isMobile = false
}, ref) => {
  const mountRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showSpecs, setShowSpecs] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const texturesRef = useRef({});
  const [rotationAngle, setRotationAngle] = useState(0);

  // Set default panel if not provided
  const defaultPanel = useMemo(() => {
    // Use the provided selectedPanel if it exists
    if (selectedPanel) return selectedPanel;
    
    // Otherwise use the first panel from options if available
    if (panelOptions && panelOptions.length > 0) return panelOptions[0];
    
    // Default panel data as fallback
    return {
      brand: "LG",
      model: "NeON H+",
      wattage: 415,
      efficiency: 21.3,
      warranty: "25 years",
      specs: {
        description: "Premium panels with advanced technology",
        cellType: "Monocrystalline PERC",
        temperatureCoefficient: "-0.35%/°C",
        frame: "Anodized aluminum",
        dimensions: "1755 x 1038 x 35mm"
      },
      keyFeatures: [
        "High power density",
        "Excellent low-light performance",
        "PID resistance",
        "Salt mist and ammonia resistance",
        "Hail impact resistance"
      ]
    };
  }, [selectedPanel, panelOptions]);
  
  // Panel that's currently being displayed in 3D
  const [activePanel, setActivePanel] = useState(defaultPanel);

  // Update activePanel when selectedPanel changes
  useEffect(() => {
    if (selectedPanel) {
      setActivePanel(selectedPanel);
    }
  }, [selectedPanel]);

  // Panel mesh ref to control animations
  const panelMeshRef = useRef(null);
  
  // Preload textures once at the beginning
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const loadingPromises = [];
    const loadedTextures = {};
    
    // Start loading all textures
    Object.entries(PANEL_TEXTURES).forEach(([panelType, textures]) => {
      const frontPromise = new Promise(resolve => {
        // Create texture with all settings before it's bound to the GPU
        const texture = textureLoader.load(textures.front, () => {
          // Only set these properties in the callback after loading
          texture.needsUpdate = true;
          resolve();
        });
        
        // Set these options before loading starts
        texture.anisotropy = 16;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        if (!loadedTextures[panelType]) loadedTextures[panelType] = {};
        loadedTextures[panelType].front = texture;
      });
      
      const backPromise = new Promise(resolve => {
        // Create texture with all settings before it's bound to the GPU
        const texture = textureLoader.load(textures.back, () => {
          // Only set these properties in the callback after loading
          texture.needsUpdate = true;
          resolve();
        });
        
        // Set these options before loading starts
        texture.anisotropy = 16;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        if (!loadedTextures[panelType]) loadedTextures[panelType] = {};
        loadedTextures[panelType].back = texture;
      });
      
      loadingPromises.push(frontPromise, backPromise);
    });
    
    // When all textures are loaded
    Promise.all(loadingPromises).then(() => {
      texturesRef.current = loadedTextures;
      setTexturesLoaded(true);
    });
    
    return () => {
      // Clean up textures to prevent memory leaks
      Object.values(texturesRef.current).forEach(texturePair => {
        texturePair.front?.dispose();
        texturePair.back?.dispose();
      });
      texturesRef.current = {};
    };
  }, []);

  // Create and maintain the 3D scene - only after textures are loaded
  useEffect(() => {
    if (!texturesLoaded || !mountRef.current) return;
    
    // Only create renderer if we can get a context
    if (!WebGLContextManager.requestContext()) {
      console.log("Too many active WebGL contexts, not initializing new one");
      setRendererReady(true); // Fake it to hide loading indicator
      return () => {}; // Empty cleanup function
    }
    
    // Scene setup
    const scene = new THREE.Scene();
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(1.0);
    mountRef.current.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    
    // Panel geometry
    const panelWidth = 2.5;  // 25% larger than 2
    const panelHeight = 4.5;  // 25% larger than 3.6
    const panelDepth = 0.1;
    const geometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth);
    
    // Frame color
    const frameColor = new THREE.Color(0x333333);
    
    // Always use the Ureco 400 textures instead of the selected panel's textures
    const frontTexture = texturesRef.current['Ureco 400']?.front;
    const backTexture = texturesRef.current['Ureco 400']?.back;
    
    // Create all materials
    const materials = [
      new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.5 }), // right
      new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.5 }), // left
      new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.5 }), // top
      new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.5 }), // bottom
      new THREE.MeshStandardMaterial({ 
        map: frontTexture || null,  // Add null fallback
        roughness: 0.2,
        metalness: 0.7,
        envMapIntensity: 1.0
      }), // front
      new THREE.MeshStandardMaterial({ 
        map: backTexture || null,  // Add null fallback
        roughness: 0.5,
        metalness: 0.4,
        envMapIntensity: 0.7
      })   // back
    ];
    
    // Create panel mesh
    const solarPanel = new THREE.Mesh(geometry, materials);
    scene.add(solarPanel);
    panelMeshRef.current = solarPanel;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Main white light - positioned to illuminate the front face
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(1, 2, 5); // Positioned directly in front of the panel
    scene.add(mainLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
    backLight.position.set(0, 1, -5); // Positioned behind the panel
    scene.add(backLight);
    
    // Subtle purple accent (matching from-purple-400 in the modal)
    const purpleLight = new THREE.DirectionalLight(0xa78bfa, 0.2);
    purpleLight.position.set(-1.5, 0.5, 1);
    scene.add(purpleLight);

    // Subtle blue accent (matching to-blue-500 in the modal)
    const blueLight = new THREE.DirectionalLight(0x3b82f6, 0.3);
    blueLight.position.set(1.5, -0.5, 1);
    scene.add(blueLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    const animationId = requestAnimationFrame(animate);
    
    // Responsive resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Save references for cleanup and material updates
    const sceneRef = {
      renderer,
      controls,
      materials,
      solarPanel
    };
    
    // Store the scene reference
    mountRef.current.sceneRef = sceneRef;
    
    // Indicate renderer is ready
    setRendererReady(true);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      geometry.dispose();
      materials.forEach(material => material.dispose());
      renderer.dispose();
      cancelAnimationFrame(animationId);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      // Release the context when done
      WebGLContextManager.releaseContext();
    };
  }, [texturesLoaded, autoRotate]); // Remove activePanel from dependencies

  // Material update effect for panel changes after initial render
  useEffect(() => {
    // Skip if scene isn't set up yet or textures aren't loaded
    if (!texturesLoaded || !mountRef.current?.sceneRef) return;
    
    const sceneRef = mountRef.current.sceneRef;
    const { materials } = sceneRef;
    
    // Always use Ureco 400 textures regardless of activePanel
    const frontTexture = texturesRef.current['Ureco 400']?.front;
    const backTexture = texturesRef.current['Ureco 400']?.back;
    
    // Only update materials if textures exist and materials are set up
    if (frontTexture && backTexture && materials && materials.length >= 6) {
      // Instead of changing the texture map directly, create new materials
      if (frontTexture !== materials[4].map) {
        const newFrontMaterial = new THREE.MeshStandardMaterial({ 
          map: frontTexture,
          roughness: 0.2,
          metalness: 0.7,
          envMapIntensity: 1.0
        });
        
        materials[4].dispose(); // Dispose old material
        materials[4] = newFrontMaterial;
      }
      
      if (backTexture !== materials[5].map) {
        const newBackMaterial = new THREE.MeshStandardMaterial({ 
          map: backTexture,
          roughness: 0.5,
          metalness: 0.4,
          envMapIntensity: 0.7
        });
        
        materials[5].dispose(); // Dispose old material
        materials[5] = newBackMaterial;
      }
      
      // Update the mesh materials if panel mesh exists
      if (panelMeshRef.current) {
        panelMeshRef.current.material = materials;
      }
    }
  }, [texturesLoaded]); // Remove activePanel from dependencies

  // Show specific loading state while textures are loading
  const isLoading = !rendererReady || !texturesLoaded;

  // Handle panel flipping animation
  useEffect(() => {
    if (!panelMeshRef.current) return;
    
    const panel = panelMeshRef.current;
    const targetRotation = isFlipped ? Math.PI : 0;
    
    // Animate the flip
    const startRotation = panel.rotation.y;
    const delta = targetRotation - startRotation;
    const duration = 1000; // ms
    const startTime = Date.now();
    
    const animateFlip = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth flip
      const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const easedProgress = easeInOut(progress);
      
      panel.rotation.y = startRotation + delta * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animateFlip);
      }
    };
    
    animateFlip();
  }, [isFlipped]);
  
  // Update auto-rotation state
  useEffect(() => {
    const controls = mountRef.current?.querySelector('canvas')?.__controls;
    if (controls) {
      controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);
  
  // Remove panel switching animation to prevent re-renders
  // Original panel switching animation effect has been removed
  
  // Efficiency rating visualization
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 22) return "#22c55e"; // Green for high efficiency
    if (efficiency >= 21) return "#84cc16"; // Lime for good efficiency
    if (efficiency >= 20) return "#eab308"; // Yellow for average
    return "#f97316"; // Orange for lower efficiency
  };
  
  // Price estimation based on wattage (simplified model)
  const estimatePrice = (wattage) => {
    const basePrice = 0.75; // $0.75 per watt baseline
    let pricePerWatt;
    
    if (wattage >= 430) {
      pricePerWatt = basePrice * 1.2; // Premium for high wattage
    } else if (wattage >= 415) {
      pricePerWatt = basePrice * 1.1; // Slight premium
    } else {
      pricePerWatt = basePrice;
    }
    
    return (pricePerWatt * wattage).toFixed(2);
  };
  
  // Handle panel selection
  const handlePanelSelect = (panel) => {
    setActivePanel(panel);
    if (onSelectPanel) onSelectPanel(panel);
  };
  
  // Container styles based on mobile/desktop
  const containerStyle = {
    height: `${containerHeight}px`,
    borderRadius: "0",
    border: "none",
    boxShadow: "none",
    overflow: "visible",
    position: "relative",
    ...style
  };

  // Handle manual rotation
  const handleRotate = (direction) => {
    if (!panelMeshRef.current) return;
    
    const panel = panelMeshRef.current;
    const rotationAmount = direction === 'left' ? -Math.PI/2 : Math.PI/2;
    const targetRotation = rotationAngle + rotationAmount;
    
    // Animate the rotation
    const startRotation = panel.rotation.y;
    const delta = rotationAmount;
    const duration = 500; // ms
    const startTime = Date.now();
    
    const animateRotation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth rotation
      const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const easedProgress = easeInOut(progress);
      
      panel.rotation.y = startRotation + delta * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        setRotationAngle(targetRotation);
      }
    };
    
    animateRotation();
  };

  useImperativeHandle(ref, () => ({
    destroy: () => {
      // Cancel any animations
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Force disposal of all resources
      if (mountRef.current?.sceneRef) {
        const { renderer, scene } = mountRef.current.sceneRef;
        
        // Dispose of all scene resources
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        
        renderer.dispose();
        renderer.forceContextLoss();
        
        // Release the context
        WebGLContextManager.releaseContext();
      }
    }
  }));

  return (
    <div className="h-full overflow-visible" style={{ position: "relative" }}>
      {/* Add Centered Panel Glow */}
   
      
      {/* Rotation Arrows */}
 { !isMobile &&    <div className="absolute inset-y-0 left-[-10%] flex items-center  pl-[20%] pt-[20%]">
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
      
      { !isMobile && <div className="absolute inset-y-0 right-[-10%] flex items-center  pr-[20%] pt-[20%]">
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
      
      {/* Initial Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 ">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full animate-spin mb-3"></div>
            <div className="text-white text-sm">
              {texturesLoaded ? 'Setting up 3D viewer...' : 'Loading textures...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SolarPanelViewer;