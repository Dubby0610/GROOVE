import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface ThreeElevatorSceneProps {
  floor: number;
  onLoaded?: () => void;
}

const ThreeElevatorScene: React.FC<ThreeElevatorSceneProps> = ({ floor, onLoaded }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 500);
    camera.position.set(0, 5, -4.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

    // Load Draco-compressed elevator model
    loader.load("/models/elevator-draco.glb", (gltf: any) => {
      gltf.scene.scale.set(2.5, 2.5, 2.5);
      gltf.scene.position.set(0, -1.5, 0);
      scene.add(gltf.scene);
      if (onLoaded) onLoaded();
    });

    let human: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let standAction: THREE.AnimationAction | null = null; // <-- Add this

    // Load Draco-compressed human model
    loader.load("/models/human-draco.glb", (gltf: any) => {
      gltf.scene.scale.set(2.5, 2.5, 2.5);
      gltf.scene.position.set(0, -1.5, 0);
      scene.add(gltf.scene);

      human = gltf.scene; 
      mixer = new THREE.AnimationMixer(human);

      // Find "Standing" animation
      const standingClip = gltf.animations.find((clip) => clip.name === "Standing");

      if (standingClip) {
        standAction = mixer.clipAction(standingClip);
        standAction.play();
        standAction.paused = false;
      } else {
        console.warn("No 'Standing' animation found in GLB file.");
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
    let frameId: number;
    const animate = () => {
      // renderer.render(scene, camera);
      // frameId = requestAnimationFrame(animate);
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer) mixer.update(delta); 

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      // cancelAnimationFrame(frameId);
      renderer.dispose();
      controls.dispose();
      window.removeEventListener("resize", handleResize);
      dracoLoader.dispose(); // Dispose here, after all loads
    };
  }, []); // Only run once

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ width: "100%", height: "100%", background: "black" }}
    />
  );
};

export default ThreeElevatorScene;