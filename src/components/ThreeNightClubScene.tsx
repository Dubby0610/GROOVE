import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

interface ThreeNightClubSceneProps {
  floor: number;
  onLoaded?: () => void;
}

const ThreeNightClubScene: React.FC<ThreeNightClubSceneProps> = ({ floor, onLoaded }) => {
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

  // Add this comment at the top for user guidance
  // If you see type errors for 'three', run: npm i --save-dev @types/three
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current ? mountRef.current.clientWidth : window.innerWidth;
    const height = mountRef.current ? mountRef.current.clientHeight : window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Set renderer pixel ratio for performance
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false; // Important for composer
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // --- BLOOM SETUP ---
    const BLOOM_LAYER = 1;
    const bloomParams = {
      exposure: 1,
      bloomStrength: 2.5,
      bloomThreshold: 0,
      bloomRadius: 0.2,
    };
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // Render bloom at half resolution for performance
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width / 2, height / 2),
      bloomParams.bloomStrength, // strength
      bloomParams.bloomRadius,   // radius
      bloomParams.bloomThreshold // threshold
    );
    composer.addPass(bloomPass);
    // Helper to set bloom layer
    function setBloomLayer(object: THREE.Object3D, enabled: boolean) {
      object.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          if (enabled) {
            child.layers.enable(0);           // <--- Add this line
            child.layers.enable(BLOOM_LAYER); // <--- Already present
          } else {
            child.layers.set(0);
          }
        }
      });
    }

    scene.add(new THREE.AmbientLight(0xcccccc, 0.3));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.target.set(0, 1.2, 0);
    controls.update();

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

    // Lighting and animation state variables
    let mixer: THREE.AnimationMixer | null = null;
    let dancerMixer: THREE.AnimationMixer | null = null;
    let movingLights: { movingLight: THREE.SpotLight; target: THREE.Object3D }[] = [];
    let staticLights: { staticLight: THREE.Light }[] = [];
    let animationState = AnimationState.INITIAL;
    let stateStartTime = 0;
    let sequenceIndex = 0;
    let previousColors: number[] = [];

    // Animate helpers
    const lerpColor = (startColor: number, endColor: number, alpha: number) => {
      const start = new THREE.Color(startColor);
      const end = new THREE.Color(endColor);
      const lerped = new THREE.Color();
      lerped.lerpColors(start, end, alpha);
      return lerped;
    };

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
      // --- Set bloom layer for dance floor meshes ---
      // Find by name: 'Dance-floor'
      const danceFloorMeshes: THREE.Object3D[] = [];
      // Store original materials for dance floor meshes
      const danceFloorOriginalMaterials: Record<string, THREE.Material> = {};
      clubGltf.scene.traverse((child: any) => {
        if (child.name === 'Dance-floor') {
          setBloomLayer(child, true);
          danceFloorMeshes.push(child);
          child.traverse((mesh: any) => {
            if (mesh instanceof THREE.Mesh) {
              danceFloorOriginalMaterials[mesh.uuid] = mesh.material;
              // Optionally, ensure the material supports emissive
              if (mesh.material && 'emissive' in mesh.material) {
                mesh.material.emissive = mesh.material.emissive || new THREE.Color(0x222222);
                mesh.material.emissiveIntensity = 1;
              }
            }
          });
        }
      });
      scene.add(clubGltf.scene);

      // Optionally setup club animation mixer
      if (clubGltf.animations && clubGltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(clubGltf.scene);
        clubGltf.animations.forEach((clip: any) => {
          const action = mixer!.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        });
      }

      // --- Add dancer model ---
      const dancer = dancerGltf.scene;
      dancer.position.set(0, 0.2, 0); // Position the dancer
      dancer.scale.set(2.5, 2.5, 2.5);
      scene.add(dancer);

      // Setup dancer animation mixer
      if (dancerGltf.animations && dancerGltf.animations.length > 0) {
        dancerMixer = new THREE.AnimationMixer(dancer);
        dancerGltf.animations.forEach((clip: any) => {
          const action = dancerMixer!.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        });
      }

      // --- Lighting setup (moved here so lights are available for animation) ---
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
      movingLights = [
        createMovingLights(0xcc0000, 5, 15, 5, 5000), // Red
        createMovingLights(0x00cc00, -5, 15, 5, 5000), // Green
        createMovingLights(0x0000cc, -5, 15, -5, 5000), // Blue
        createMovingLights(0xcccccc, 5, 15, -5, 5000), // White
      ];
      movingLights.forEach(({ movingLight }) => scene.add(movingLight));

      const createStaticLights = (
        color: number,
        x: number,
        y: number,
        z: number,
        intensity: number
      ) => {
        const staticLight = new THREE.PointLight(color, intensity);
        staticLight.position.set(x, y, z);
        staticLight.distance = 7;
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
        staticLight.shadow.mapSize.width = 1024;
        staticLight.shadow.mapSize.height = 1024;
        staticLight.shadow.camera.near = 0.1;
        staticLight.shadow.camera.far = 30;
        staticLight.shadow.focus = 1;
        staticLight.shadow.bias = -0.0001;
        staticLight.shadow.normalBias = 0.0001;
        const target = new THREE.Object3D();
        target.position.set(0, 8, 0);
        scene.add(target);
        staticLight.target = target;
        return { staticLight };
      };
      staticLights = [
        createStaticLights(0x987234, 0, 12, 0, 50000),      // Top point light
        createBottomSpotLight(0x980022, 0, 4, 0, 50000),    // Bottom spotlight targeting disco ball
        createStaticLights(0x002298, -5, 8, 0, 50000),      // Other point lights
        createStaticLights(0x002298, 5, 8, 0, 50000),
        createStaticLights(0x002298, 0, 8, -5, 5000),
        createStaticLights(0x002298, 0, 8, 5, 5000),
      ];
      staticLights.forEach(({ staticLight }) => scene.add(staticLight));

      // --- Animation loop ---
      const clock = new THREE.Clock();
      const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
      const materials: Record<string, THREE.Material> = {};
      // Throttle animation loop to 30 FPS for performance
      let lastFrame = 0;
      const targetFPS = 30;
      // Helper to darken non-bloom objects
      function darkenNonBloom(obj: THREE.Object3D) {
        if (obj instanceof THREE.Mesh && obj.layers.mask !== BLOOM_LAYER) {
          materials[obj.uuid] = (obj as any).material;
          (obj as any).material = darkMaterial;
        }
      }
      function restoreMaterial(obj: THREE.Object3D) {
        if (obj instanceof THREE.Mesh && materials[obj.uuid]) {
          (obj as any).material = materials[obj.uuid];
          delete materials[obj.uuid];
        }
      }
      const animate = () => {
        requestAnimationFrame(animate);
        const now = performance.now();
        if (now - lastFrame < 1000 / targetFPS) return;
        lastFrame = now;
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        // Animate dance floor emissive for glow
        danceFloorMeshes.forEach((group) => {
          group.traverse((mesh: any) => {
            if (mesh instanceof THREE.Mesh && mesh.material && 'emissive' in mesh.material) {
              // Animate emissive intensity for a lighter, pulsing glow
              mesh.material.emissiveIntensity = 2.5 + Math.sin(time * 4 + mesh.id) * 2.0;
            }
          });
        });
        // Animation state machine for static lights
        switch (animationState) {
          case AnimationState.INITIAL:
            if (time - stateStartTime > 5) {
              animationState = AnimationState.SLOW_SEQUENCE;
              stateStartTime = time;
              sequenceIndex = 0;
              previousColors = staticLights.map(({ staticLight }) => staticLight.color.getHex());
            }
            break;
          case AnimationState.SLOW_SEQUENCE: {
            const slowDuration = 1.0;
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
              staticLights.forEach(({ staticLight }, index) => {
                const startColor = previousColors[index];
                const targetColor = SEQUENCE_COLORS[sequenceIndex];
                const lerpedColor = lerpColor(startColor, targetColor, slowProgress);
                staticLight.color = lerpedColor;
              });
            }
            break;
          }
          case AnimationState.FAST_SEQUENCE: {
            const fastDuration = 0.3;
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
              staticLights.forEach(({ staticLight }, index) => {
                const startColor = previousColors[index];
                const targetColor = SEQUENCE_COLORS[sequenceIndex];
                const lerpedColor = lerpColor(startColor, targetColor, fastProgress);
                staticLight.color = lerpedColor;
              });
            }
            break;
          }
          case AnimationState.RAPID_CHANGE: {
            const rapidDuration = 5;
            const rapidCycleDuration = 0.1;
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
        }
        // Animate spotlights
        movingLights.forEach(({ movingLight, target }, index) => {
          // Always return a pattern object
          const pattern = (t: number): { x: number; z: number; intensity: number } => {
            const baseSpeed = 1.5;
            const t1 = t * baseSpeed;
            const t2 = t * baseSpeed * 0.7;
            switch(index) {
              case 0:
                return { x: Math.sin(t1) * 6, z: Math.cos(t1 * 0.5) * 6, intensity: 5000 * (0.8 + Math.sin(t2 * 2) * 0.2) };
              case 1:
                return { x: Math.cos(t1 * 1.3) * 5 * Math.sin(t2 * 0.2), z: Math.sin(t1 * 1.3) * 5 * Math.sin(t2 * 0.2), intensity: 5000 * (0.7 + Math.sin(t2 * 3) * 0.3) };
              case 2:
                return { x: Math.sin(t1 * 2) * 4, z: Math.sin(t1) * Math.cos(t1) * 4, intensity: 5000 * (0.9 + Math.sin(t2 * 1.5) * 0.1) };
              case 3: {
                const spiral = t1 * 0.5;
                return { x: Math.cos(spiral) * (3 + Math.sin(t2)), z: Math.sin(spiral) * (3 + Math.sin(t2)), intensity: 5000 * (0.85 + Math.sin(t2 * 2.5) * 0.15) };
              }
              default:
                return { x: 0, z: 0, intensity: 5000 };
            }
          };
          const current = pattern(time);
          target.position.x = current.x;
          target.position.y = Math.sin(time * (1.5 + index * 0.2)) * 2;
          target.position.z = current.z;
          movingLight.intensity = current.intensity;
          movingLight.angle = Math.PI / 12 + Math.sin(time * 0.8 + index) * 0.1;
          movingLight.penumbra = 0.5 + Math.sin(time * 0.5 + index * Math.PI/2) * 0.3;
          target.updateMatrixWorld();
        });
        // Update model animations
        if (mixer) mixer.update(delta);
        if (dancerMixer) dancerMixer.update(delta);
        // --- BLOOM RENDERING ---
        // 1. Render bloom only for dance floor
        scene.traverse(darkenNonBloom);
        camera.layers.set(BLOOM_LAYER);
        renderer.clear(); // Clear before bloom pass
        composer.render();
        // 2. Render the rest of the scene (no bloom)
        scene.traverse(restoreMaterial);
        camera.layers.set(0);
        renderer.clearDepth(); // Clear depth before normal render
        renderer.render(scene, camera);
      };
      animate();
      if (typeof onLoaded === 'function') onLoaded();

      // --- Resize handler ---
      const handleResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        renderer.setSize(w, h);
        composer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", handleResize);

      // --- Cleanup ---
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
    }).catch((error) => {
      console.error("Error loading models:", error);
    });
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
