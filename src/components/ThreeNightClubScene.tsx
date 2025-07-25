import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface ThreeNightClubSceneProps {
  floor: number;
}

const ThreeNightClubScene: React.FC<ThreeNightClubSceneProps> = ({ floor }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Add these color constants at the top of your component
  const COLORS = {
    BLACK: 0x000000,
    RED: 0xff0000,
    GREEN: 0x00ff00,
    BLUE: 0x0000ff,
    YELLOW: 0xffff00,
    INITIAL: [0x987234, 0x980022, 0x002298, 0x002298, 0x002298, 0x002298],
  };

  // Add this animation state enum
  const AnimationState = {
    INITIAL: "initial",
    SLOW_SEQUENCE: "slow_sequence",
    FAST_SEQUENCE: "fast_sequence",
    RAPID_CHANGE: "rapid_change",
  };

  // Add these constants after COLORS
  const LIGHT_PATTERNS = {
    POSITIONS: [
      { x: 5, y: 15, z: 5 },    // Red
      { x: -5, y: 15, z: 5 },   // Green
      { x: -5, y: 15, z: -5 },  // Blue
      { x: 5, y: 15, z: -5 },   // White
    ],
    TIMING: {
      PATTERN_DURATION: 8,
      CROSSFADE: 0.5
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xcccccc, 0.3));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.target.set(0, 1.2, 0);
    controls.update();
    // controls.maxPolarAngle = Math.PI / 2;

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    loader.setDRACOLoader(dracoLoader);

    // Helper to load a GLTF as a Promise
    function loadGLTF(url: string): Promise<any> {
      return new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });
    }

    // Load both models in parallel
    Promise.all([
      loadGLTF(`/models/floor_${floor}-draco.glb`),
      loadGLTF("/models/dancer-draco.glb")
    ]).then(([clubGltf, dancerGltf]) => {
      // --- Add club model ---
      clubGltf.scene.position.set(0, 0, 0);
      clubGltf.scene.scale.set(2.5, 2.5, 2.5);
      clubGltf.scene.traverse((child: any) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(clubGltf.scene);

      // --- Add dancer model ---
      const dancer = dancerGltf.scene;
      dancer.position.set(0, -0.1, -2.5); // Adjust as needed
      dancer.scale.set(2.5, 2.5, 2.5);
      dancer.traverse((child: any) => {
        if (child.isMesh) {
          // Convert to MeshPhysicalMaterial for realistic PBR and IOR
          const oldMat = child.material;
          const newMat = new THREE.MeshPhysicalMaterial({
            color: oldMat.color ? oldMat.color.clone() : undefined,
            map: oldMat.map || null,
            roughness: 0.8,      // Higher = less shiny
            metalness: 0.1,      // Lower = less metallic
            ior: 1.4,            // Index of Refraction (1.3-1.5 for skin/clothes)
            reflectivity: 0.2,   // Lower = less mirror-like
            transmission: 0,     // 0 for non-glass
            thickness: 0.01,     // For transmission, not needed here
            clearcoat: 0.1,      // Subtle clearcoat for realism
            clearcoatRoughness: 0.8,
            skinning: oldMat.skinning || false,
            transparent: oldMat.transparent || false,
            opacity: oldMat.opacity !== undefined ? oldMat.opacity : 1,
          });
          if (oldMat.map) {
            oldMat.map.encoding = THREE.sRGBEncoding;
            oldMat.map.needsUpdate = true;
          }
          child.material = newMat;
          child.material.needsUpdate = true;

          // Enable shadows for dancer
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(dancer);

      // --- Setup animation mixers ---
      let mixer: THREE.AnimationMixer | null = null;
      if (clubGltf.animations && clubGltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(clubGltf.scene);
        clubGltf.animations.forEach((clip: any) => {
          const action = mixer!.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        });
      }

      let dancerMixer: THREE.AnimationMixer | null = null;
      if (dancerGltf.animations && dancerGltf.animations.length > 0) {
        dancerMixer = new THREE.AnimationMixer(dancer);
        dancerGltf.animations.forEach((clip: any) => {
          const action = dancerMixer!.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        });
      }

      // --- Start animation loop ---
      const clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        if (dancerMixer) dancerMixer.update(delta);
        // ... your other animation code ...
        renderer.render(scene, camera);
      };
      animate();
    }).catch((error) => {
      console.error("Error loading models:", error);
    });

    // create spotlight inside the discoball
    // const insideLight = new THREE.PointLight('#FF0000', 500);
    // insideLight.position.set(0, 8, 0);
    // insideLight.distance = 20;
    // scene.add(insideLight);

    // Create four spotlights for the club
    const createMovingLights = (
      color: number,
      x: number,
      y: number,
      z: number,
      intensity: number
    ) => {
      const movingLight = new THREE.SpotLight(color, intensity);
      movingLight.position.set(x, y, z);
      movingLight.angle = Math.PI / 12;
      movingLight.penumbra = 0.9;
      movingLight.distance = 26;
      movingLight.castShadow = true;
      movingLight.shadow.mapSize.width = 512;
      movingLight.shadow.mapSize.height = 512;

      // Add spotlight target
      const target = new THREE.Object3D();
      target.position.set(0, 0, 0);
      scene.add(target);
      movingLight.target = target;

      return { movingLight, target };
    };

    // Create four spotlights with different colors
    const movingLights = [
      createMovingLights(0xcc0000, 5, 15, 5, 5000), // Red
      createMovingLights(0x00cc00, -5, 15, 5, 5000), // Green
      createMovingLights(0x0000cc, -5, 15, -5, 5000), // Blue
      createMovingLights(0xcccccc, 5, 15, -5, 5000), // White
    ];

    const createStaticLights = (
      color: number,
      x: number,
      y: number,
      z: number,
      intensity: number
    ) => {
      const staticLight = new THREE.PointLight(color, intensity);
      staticLight.position.set(x, y, z);
      staticLight.distance = 7; // Changed from 10 to 5
      staticLight.decay = 2;
      staticLight.castShadow = true;
      staticLight.shadow.mapSize.width = 512;
      staticLight.shadow.mapSize.height = 512;
      staticLight.shadow.camera.near = 0.1;
      staticLight.shadow.camera.far = 20;
      staticLight.shadow.bias = -0.001;
      staticLight.shadow.normalBias = 0.001;

      return { staticLight };
    };

    // Add this new function for the bottom spotlight
    const createBottomSpotLight = (
      color: number,
      x: number,
      y: number,
      z: number,
      intensity: number
    ) => {
      const staticLight = new THREE.SpotLight(color, intensity);
      staticLight.position.set(x, y, z);
      staticLight.angle = Math.PI / 6;
      staticLight.penumbra = 1;
      staticLight.distance = 10;
      staticLight.decay = 2;
      staticLight.castShadow = true;
      
      // Configure shadow settings
      staticLight.shadow.mapSize.width = 1024;
      staticLight.shadow.mapSize.height = 1024;
      staticLight.shadow.camera.near = 0.1;
      staticLight.shadow.camera.far = 30;
      staticLight.shadow.focus = 1;
      staticLight.shadow.bias = -0.0001;
      staticLight.shadow.normalBias = 0.0001;

      // Add target pointing to disco ball center
      const target = new THREE.Object3D();
      target.position.set(0, 8, 0); // Target the disco ball center
      scene.add(target);
      staticLight.target = target;

      return { staticLight };
    };

    // Update the staticLights array to use spotlight for bottom light
    const staticLights = [
      createStaticLights(0x987234, 0, 12, 0, 50000),      // Top point light
      createBottomSpotLight(0x980022, 0, 4, 0, 50000),    // Bottom spotlight targeting disco ball
      createStaticLights(0x002298, -5, 8, 0, 50000),      // Other point lights
      createStaticLights(0x002298, 5, 8, 0, 50000),
      createStaticLights(0x002298, 0, 8, -5, 5000),
      createStaticLights(0x002298, 0, 8, 5, 5000),
    ];

    movingLights.forEach(({ movingLight }) => {
      scene.add(movingLight);
    });

    staticLights.forEach(({ staticLight }) => {
      scene.add(staticLight);
    });

    // Add these helper functions at the top of your component
    const lerpColor = (startColor: number, endColor: number, alpha: number) => {
      const start = new THREE.Color(startColor);
      const end = new THREE.Color(endColor);
      const lerped = new THREE.Color();
      lerped.lerpColors(start, end, alpha);
      return lerped;
    };

    // Animate
    const clock = new THREE.Clock();
    let animationState = AnimationState.INITIAL;
    let stateStartTime = 0;
    let sequenceIndex = 0;
    let previousColors: number[] = [];

    const SEQUENCE_COLORS = [
      COLORS.BLACK,
      COLORS.RED,
      COLORS.BLACK,
      COLORS.GREEN,
      COLORS.BLACK,
      COLORS.BLUE,
      COLORS.BLACK,
      COLORS.YELLOW,
    ];

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Animation state machine
      switch (animationState) {
        case AnimationState.INITIAL:
          if (time - stateStartTime > 5) {
            animationState = AnimationState.SLOW_SEQUENCE;
            stateStartTime = time;
            sequenceIndex = 0;
            previousColors = staticLights.map(({ staticLight }) => staticLight.color.getHex());
          }
          break;

        case AnimationState.SLOW_SEQUENCE:
          const slowDuration = 1.0; // 1 second per color
          const slowProgress = (time - stateStartTime) / slowDuration;
          
          if (slowProgress >= 1) {
            stateStartTime = time;
            previousColors = staticLights.map(({ staticLight }) => staticLight.color.getHex());
            sequenceIndex++;
            
            if (sequenceIndex >= SEQUENCE_COLORS.length) {
              animationState = AnimationState.FAST_SEQUENCE;
              sequenceIndex = 0;
            }
          } else {
            // Smooth transition between colors
            staticLights.forEach(({ staticLight }, index) => {
              const startColor = previousColors[index];
              const targetColor = SEQUENCE_COLORS[sequenceIndex];
              const lerpedColor = lerpColor(startColor, targetColor, slowProgress);
              staticLight.color = lerpedColor;
            });
          }
          break;

        case AnimationState.FAST_SEQUENCE:
          const fastDuration = 0.3; // 0.3 seconds per color
          const fastProgress = (time - stateStartTime) / fastDuration;
          
          if (fastProgress >= 1) {
            stateStartTime = time;
            previousColors = staticLights.map(({ staticLight }) => staticLight.color.getHex());
            sequenceIndex++;
            
            if (sequenceIndex >= SEQUENCE_COLORS.length) {
              animationState = AnimationState.RAPID_CHANGE;
              stateStartTime = time;
              previousColors = staticLights.map(({ staticLight }) => staticLight.color.getHex());
            }
          } else {
            // Smooth transition between colors
            staticLights.forEach(({ staticLight }, index) => {
              const startColor = previousColors[index];
              const targetColor = SEQUENCE_COLORS[sequenceIndex];
              const lerpedColor = lerpColor(startColor, targetColor, fastProgress);
              staticLight.color = lerpedColor;
            });
          }
          break;

        case AnimationState.RAPID_CHANGE:
          const rapidDuration = 5; // 5 seconds of rapid changes
          const rapidCycleDuration = 0.1; // Duration of each rapid color change
          
          if (time - stateStartTime <= rapidDuration) {
            const cycleProgress = ((time - stateStartTime) % rapidCycleDuration) / rapidCycleDuration;
            
            staticLights.forEach(({ staticLight }, index) => {
              const startColor = previousColors[index];
              const targetColor = Math.random() * 0xffffff;
              const lerpedColor = lerpColor(startColor, targetColor, cycleProgress);
              staticLight.color = lerpedColor;
              
              if (cycleProgress >= 0.99) {
                previousColors[index] = targetColor;
              }
            });
          } else {
            // Smooth transition back to initial state
            const transitionDuration = 1.0;
            const transitionProgress = Math.min((time - stateStartTime - rapidDuration) / transitionDuration, 1);
            
            staticLights.forEach(({ staticLight }, index) => {
              const startColor = previousColors[index];
              const targetColor = COLORS.INITIAL[index];
              const lerpedColor = lerpColor(startColor, targetColor, transitionProgress);
              staticLight.color = lerpedColor;
            });
            
            if (transitionProgress >= 1) {
              animationState = AnimationState.INITIAL;
              stateStartTime = time;
            }
          }
          break;
      }

      // Animate spotlights
      movingLights.forEach(({ movingLight, target }, index) => {
        const time = clock.getElapsedTime();
        
        // Create complex patterns using combinations of sine waves
        const pattern = (t: number) => {
          const baseSpeed = 1.5;
          const t1 = t * baseSpeed;
          const t2 = t * baseSpeed * 0.7;
          
          // Different patterns based on index
          switch(index) {
            case 0: // Red light - sweeping motion
              return {
                x: Math.sin(t1) * 6,
                z: Math.cos(t1 * 0.5) * 6,
                intensity: 5000 * (0.8 + Math.sin(t2 * 2) * 0.2)
              };
            case 1: // Green light - circular motion with variations
              return {
                x: Math.cos(t1 * 1.3) * 5 * Math.sin(t2 * 0.2),
                z: Math.sin(t1 * 1.3) * 5 * Math.sin(t2 * 0.2),
                intensity: 5000 * (0.7 + Math.sin(t2 * 3) * 0.3)
              };
            case 2: // Blue light - figure-eight pattern
              return {
                x: Math.sin(t1 * 2) * 4,
                z: Math.sin(t1) * Math.cos(t1) * 4,
                intensity: 5000 * (0.9 + Math.sin(t2 * 1.5) * 0.1)
              };
            case 3: // White light - spiral motion
              const spiral = t1 * 0.5;
              return {
                x: Math.cos(spiral) * (3 + Math.sin(t2)),
                z: Math.sin(spiral) * (3 + Math.sin(t2)),
                intensity: 5000 * (0.85 + Math.sin(t2 * 2.5) * 0.15)
              };
          }
        };

        // Get current pattern values
        const current = pattern(time);
        
        // Update target position with smooth transitions
        target.position.x = current.x;
        target.position.y = Math.sin(time * (1.5 + index * 0.2)) * 2; // Varying vertical movement
        target.position.z = current.z;
        
        // Update light intensity
        movingLight.intensity = current.intensity;
        
        // Add some rotation to the light cone
        movingLight.angle = Math.PI / 12 + Math.sin(time * 0.8 + index) * 0.1;
        
        // Update the penumbra for soft/sharp light transitions
        movingLight.penumbra = 0.5 + Math.sin(time * 0.5 + index * Math.PI/2) * 0.3;
        
        // Update target matrix
        target.updateMatrixWorld();
      });

      // Update animations
      // The mixers are now handled within the Promise.all block
      // if (mixer) {
      //   mixer.update(delta); // Use the same delta time
      // }

      // if (dancerMixer) {
      //   dancerMixer.update(delta);
      // }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mountRef.current!.clientWidth;
      const h = mountRef.current!.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      controls.dispose();
      dracoLoader.dispose();
      movingLights.forEach(({ movingLight }) => {
        scene.remove(movingLight);
      });

      staticLights.forEach(({ staticLight }) => {
        scene.remove(staticLight);
      });
    };
  }, [floor]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ width: "100vw", height: "100vh", background: "black" }}
    />
  );
};

export default ThreeNightClubScene;
