import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface ThreeElevatorSceneProps {
  floor: number;
  onLoaded?: () => void;
  onElevatorSequenceEnd?: () => void; // Add this line
}

export interface ThreeElevatorSceneHandle {
  playElevatorSequence: () => void;
}

let cachedElevator: THREE.Group | null = null;
let cachedElevatorAnimations: THREE.AnimationClip[] = [];
let cachedHuman: THREE.Group | null = null;
let cachedHumanAnimations: THREE.AnimationClip[] = [];

const ThreeElevatorScene = forwardRef<ThreeElevatorSceneHandle, ThreeElevatorSceneProps>(
  ({ floor, onLoaded, onElevatorSequenceEnd }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const elevatorMeshRef = useRef<THREE.Group | null>(null);

    // Animation refs
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const humanRef = useRef<THREE.Object3D | null>(null);
    const elevatorMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const elevatorActionRef = useRef<THREE.AnimationAction | null>(null);
    const listeningActionRef = useRef<THREE.AnimationAction | null>(null);
    const humanActionsRef = useRef<{ [key: string]: THREE.AnimationAction }>({});

    // Track elevator progress for background animation
    const [elevatorProgress, setElevatorProgress] = React.useState(0);

    // Helper to play only one animation at a time (move to outer scope)
    function playOnly(actionName: string) {
      Object.entries(humanActionsRef.current).forEach(([name, action]) => {
        if (name === actionName) {
          action.reset();
          action.paused = false;
          action.play();
        } else {
          action.stop();
          action.paused = true;
        }
      });
    }

    useImperativeHandle(ref, () => ({
      playElevatorSequence: () => {
        // Play elevator animation
        if (elevatorActionRef.current) {
          elevatorActionRef.current.reset().play();
        }
        // Optionally, play a "listening" or idle animation for human here
        if (listeningActionRef.current) {
          listeningActionRef.current.reset().play();
        }
      },
    }));

    useEffect(() => {
      if (!mountRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 500);
      camera.position.set(0, 0, -4);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      const clock = new THREE.Clock();

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(5, 10, 7.5);
      scene.add(dirLight);

      // DRACO Loader setup
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      loader.setDRACOLoader(dracoLoader);

      // Helper to load a GLTF as a Promise
      function loadGLTF(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
      }

      // Load both models in parallel
      Promise.all([
        loadGLTF("/models/elevator-draco.glb"),
        loadGLTF("/models/human-draco.glb")
      ]).then(([elevatorGltf, humanGltf]) => {
        // --- Add elevator model ---
        const elevator = elevatorGltf.scene.clone(true);
        elevator.scale.set(2.5, 2.5, 2.5);
        elevator.position.set(0, -2.5, 0);
        scene.add(elevator);
        elevatorMeshRef.current = elevator;
        elevatorMixerRef.current = new THREE.AnimationMixer(elevator);
        elevatorActionRef.current = elevatorMixerRef.current.clipAction(elevatorGltf.animations[0]);
        elevatorActionRef.current.clampWhenFinished = true;
        elevatorActionRef.current.loop = THREE.LoopOnce;
        elevatorActionRef.current.paused = true;

        // --- Add human model ---
        const human = humanGltf.scene;
        human.scale.set(2.5, 2.5, 2.5);
        human.position.set(0, -2, 0);
        scene.add(human);
        human.traverse((child: any) => {
          if (child.isMesh) {
            if (!(child.material instanceof THREE.MeshStandardMaterial)) {
              const oldMat = child.material;
              const newMat = new THREE.MeshStandardMaterial({
                color: oldMat.color ? oldMat.color.clone() : undefined,
                map: oldMat.map || null,
                roughness: 0.8,
                metalness: 0.1,
                skinning: oldMat.skinning || false,
                transparent: oldMat.transparent || false,
                opacity: oldMat.opacity !== undefined ? oldMat.opacity : 1,
              });
              if (oldMat.map) {
                oldMat.map.encoding = THREE.sRGBEncoding;
                oldMat.map.needsUpdate = true;
              }
              child.material = newMat;
            } else {
              child.material.roughness = 0.8;
              child.material.metalness = 0.1;
              if (child.material.map) {
                child.material.map.encoding = THREE.sRGBEncoding;
                child.material.map.needsUpdate = true;
              }
            }
            child.material.needsUpdate = true;
          }
        });
        humanRef.current = human;
        mixerRef.current = new THREE.AnimationMixer(human);

        // Setup all actions, paused by default
        humanGltf.animations.forEach((clip: THREE.AnimationClip) => {
          const action = mixerRef.current!.clipAction(clip);
          // Set realistic timeScale for each animation
          if (clip.name === "Startwalking") {
            action.timeScale = 0.9; // slower, more natural walk
          } else if (clip.name === "Standing") {
            action.timeScale = 0.8;
          } else if (clip.name === "Listeningmusic") {
            action.timeScale = 0.7; // slow, relaxed
          } else {
            action.timeScale = 1.0;
          }
          action.paused = false;
          humanActionsRef.current[clip.name] = action;
        });

        // Log available animation names for debugging
        console.log('Available human animations:', Object.keys(humanActionsRef.current));

        // Play the "Standing" animation if it exists, otherwise play the first one
        const standingAction = humanActionsRef.current["Standing"] || Object.values(humanActionsRef.current)[0];
        if (standingAction) {
          standingAction.reset();
          standingAction.paused = false;
          standingAction.play();
        }
        (humanRef.current as any).playOnly = playOnly;
        if (humanActionsRef.current["Listeningmusic"]) {
          listeningActionRef.current = humanActionsRef.current["Listeningmusic"];
          listeningActionRef.current.loop = THREE.LoopOnce;
          listeningActionRef.current.clampWhenFinished = true;
          listeningActionRef.current.timeScale = 0.5;
        }
        if (onLoaded) onLoaded();
      });

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableRotate = false;

      renderer.physicallyCorrectLights = true;
      renderer.outputEncoding = THREE.sRGBEncoding;

      // Mount renderer
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(renderer.domElement);

      // Handle resize
      const handleResize = () => {
        const width = mountRef.current!.clientWidth;
        const height = mountRef.current!.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", handleResize);

      // Animate
      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (mixerRef.current) mixerRef.current.update(delta); // no slowFactor
        if (elevatorMixerRef.current) elevatorMixerRef.current.update(delta);
        // Elevator movement visualization and background progress
        let progress = 0;
        if (elevatorActionRef.current && elevatorMeshRef.current) {
          const action = elevatorActionRef.current;
          const duration = action.getClip().duration;
          if (action.isRunning()) {
            progress = Math.min(action.time / duration, 1);
            elevatorMeshRef.current.position.y = -2;
          } else {
            elevatorMeshRef.current.position.y = -2;
            progress = 0;
          }
        }
        setElevatorProgress(progress);
        renderer.render(scene, camera);
      };
      animate();

      // After models are added to the scene (inside setTimeout or after delay)
      // Set up elevator animation finished event
      function onElevatorFinished() {
        // Play "Startwalking" animation on human
        playOnly("Startwalking");
      }
      function onHumanFinished(e: any) {
        if (e.action && e.action.getClip().name === "Startwalking") {
          // Stop all human actions (freeze at last frame)
          Object.values(humanActionsRef.current).forEach(action => {
            action.stop();
          });
          // Optionally, call onElevatorSequenceEnd here if you want to notify parent
          if (typeof onElevatorSequenceEnd === "function") {
            onElevatorSequenceEnd();
          }
        }
      }

      // Attach listeners after models are loaded and actions are set up
      if (elevatorActionRef.current) {
        elevatorActionRef.current.getMixer().addEventListener('finished', onElevatorFinished);
      }
      if (mixerRef.current) {
        mixerRef.current.addEventListener('finished', onHumanFinished);
      }

      return () => {
        renderer.dispose();
        controls.dispose();
        window.removeEventListener("resize", handleResize);
        dracoLoader.dispose();

        // Dispose geometries, materials, and textures
        scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose?.();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose?.());
            else obj.material.dispose?.();
          }
          if (obj.texture) obj.texture.dispose?.();
        });
      };
    }, []); // Only run once

    return (
      <div
        ref={mountRef}
        className="w-full h-full"
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(to top, #18181b 0%, #23234a ${Math.round(
            100 - elevatorProgress * 60
          )}%, #b6d0f7 100%)`,
          transition: "background 0.5s cubic-bezier(.4,2,.6,1)",
        }}
      />
    );
  }
);

export default ThreeElevatorScene;