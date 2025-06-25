import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface ThreeElevatorSceneProps {
  floor: number;
  onLoaded?: () => void;
}

export interface ThreeElevatorSceneHandle {
  playElevatorSequence: () => void;
}

let cachedElevator: THREE.Group | null = null;
let cachedElevatorAnimations: THREE.AnimationClip[] = [];
let cachedHuman: THREE.Group | null = null;
let cachedHumanAnimations: THREE.AnimationClip[] = [];

const ThreeElevatorScene = forwardRef<ThreeElevatorSceneHandle, ThreeElevatorSceneProps>(
  ({ floor, onLoaded }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const elevatorMeshRef = useRef<THREE.Group | null>(null);

    // Animation refs
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const humanRef = useRef<THREE.Object3D | null>(null);
    const elevatorMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const elevatorActionRef = useRef<THREE.AnimationAction | null>(null);
    const listeningActionRef = useRef<THREE.AnimationAction | null>(null);

    useImperativeHandle(ref, () => ({
      playElevatorSequence: () => {
        // Play human "Listeningmusic" animation
        if (listeningActionRef.current) {
          listeningActionRef.current.reset().play();
        }
        // Play elevator animation
        if (elevatorActionRef.current) {
          elevatorActionRef.current.reset().play();
        }
      },
    }));

    useEffect(() => {
      if (!mountRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 500);
      camera.position.set(0, 5.5, -4.5);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio); // Add this line
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

      // Elevator
      const addElevator = (sceneObj: THREE.Group, anims: THREE.AnimationClip[]) => {
        const clone = sceneObj.clone(true);
        clone.scale.set(2.5, 2.5, 2.5);
        clone.position.set(0, -1.5, 0);
        scene.add(clone);
        elevatorMixerRef.current = new THREE.AnimationMixer(clone);
        elevatorActionRef.current = elevatorMixerRef.current.clipAction(anims[0]);
        elevatorActionRef.current.clampWhenFinished = true;
        elevatorActionRef.current.loop = THREE.LoopOnce;
        elevatorActionRef.current.paused = true;
        if (onLoaded) onLoaded();
      };

      if (cachedElevator) {
        addElevator(cachedElevator, cachedElevatorAnimations);
      } else {
        loader.load("/models/elevator-draco.glb", (gltf: any) => {
          cachedElevator = gltf.scene;
          cachedElevatorAnimations = gltf.animations;
          addElevator(gltf.scene, gltf.animations);
        });
      }

      // Load human model and animations
      loader.load("/models/human-draco.glb", (gltf: any) => {
        gltf.scene.scale.set(2.5, 2.5, 2.5);
        gltf.scene.position.set(0, -1.5, 0);
        scene.add(gltf.scene);

        humanRef.current = gltf.scene;
        mixerRef.current = new THREE.AnimationMixer(gltf.scene);

        // Find "Standing" and "Listeningmusic" animations
        const standingClip = gltf.animations.find((clip) => clip.name === "Standing");
        const listeningClip = gltf.animations.find((clip) => clip.name === "Listeningmusic");

        if (standingClip) {
          const standAction = mixerRef.current.clipAction(standingClip);
          standAction.play();
          standAction.paused = false;
        }
        if (listeningClip) {
          listeningActionRef.current = mixerRef.current.clipAction(listeningClip);
          listeningActionRef.current.loop = THREE.LoopOnce;
          listeningActionRef.current.clampWhenFinished = true;
          listeningActionRef.current.paused = true;
          listeningActionRef.current.timeScale = 0.5; // Slow down to half speed
        }

        if (onLoaded) onLoaded();
      });

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.target.set(0, 1.2, 0);
      controls.update();

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
        if (mixerRef.current) mixerRef.current.update(delta);
        if (elevatorMixerRef.current) elevatorMixerRef.current.update(delta);

        // Elevator movement visualization
        if (elevatorActionRef.current && elevatorMeshRef.current) {
          const action = elevatorActionRef.current;
          const duration = action.getClip().duration;
          const progress = Math.min(action.time / duration, 1); // 0 to 1
          // Move elevator up by 3 units over the animation
          elevatorMeshRef.current.position.y = -1.5 + progress * 3;
        }

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        renderer.dispose();
        controls.dispose();
        window.removeEventListener("resize", handleResize);
        dracoLoader.dispose();

        // Dispose geometries, materials, and textures
        scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose?.();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
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
        style={{ width: "100%", height: "100%", background: "black" }}
      />
    );
  }
);

export default ThreeElevatorScene;