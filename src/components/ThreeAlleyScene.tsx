import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface AlleySceneProps {
  onEnterBuilding: () => void;
}

const AlleyScene: React.FC<AlleySceneProps> = ({ onEnterBuilding }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const enterPromptRef = useRef<HTMLDivElement | null>(null);
  const movePromptRef = useRef<HTMLDivElement | null>(null);

  // Define your wall boundaries (adjust these values to match your alley layout)
  const WALLS = [
    // Example: left wall at x = -10, right wall at x = 10, back wall at z = -20, front wall at z = 40
    { axis: "x", min: -10, max: 16 }, // x boundaries (left/right)
    { axis: "z", min: -41, max: 29 }, // z boundaries (front/back)
  ];

  const isInsideWalls = (pos: THREE.Vector3) => {
    // Returns true if pos is inside all wall boundaries
    for (const wall of WALLS) {
      if (wall.axis === "x") {
        if (pos.x < wall.min || pos.x > wall.max) return false;
      }
      if (wall.axis === "z") {
        if (pos.z < wall.min || pos.z > wall.max) return false;
      }
    }
    return true;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff);

    // Scene, camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 20);

    let human: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: THREE.AnimationAction | null = null;
    let standAction: THREE.AnimationAction | null = null; // <-- Add this
    let isWalking = false;
    let alleyLoaded = false;

    const controls = new OrbitControls(camera, renderer.domElement);

    const keys = { w: false, a: false, s: false, d: false, e: false };
    const speed = 0.07;

    const isAnyMoveKey = () => keys.w || keys.a || keys.s || keys.d;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // Load Human GLB with Draco
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    const humanLoader = new GLTFLoader();
    humanLoader.setDRACOLoader(dracoLoader);

    humanLoader.load("/models/human-draco.glb", (gltf: any) => {
      human = gltf.scene;
      human.scale.set(3, 3, 3);
      human.position.set(0, -11.5, 0);
      scene.add(human);

      mixer = new THREE.AnimationMixer(human);

      // Find "Walking" animation
      const walkingClip = gltf.animations.find((clip) => clip.name === "Walking");
      const standingClip = gltf.animations.find((clip) => clip.name === "Standing");

      if (walkingClip) {
        walkAction = mixer.clipAction(walkingClip);
        walkAction.play();
        walkAction.paused = true;
      } else {
        console.warn("No 'Walking' animation found in GLB file.");
      }

      if (standingClip) {
        standAction = mixer.clipAction(standingClip);
        standAction.play();
        standAction.paused = false;
      } else {
        console.warn("No 'Standing' animation found in GLB file.");
      }
    });

    // Load Alley
    const gltfLoader = new GLTFLoader();
    let wallBoxes: THREE.Box3[] = [];

    gltfLoader.load("/models/alley.glb", (gltf: any) => {
      scene.add(gltf.scene);

      // Find wall meshes and compute bounding boxes
      gltf.scene.traverse((child: any) => {
        if (child.isMesh && child.name.toLowerCase().includes("wall")) {
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox.clone();
          box.applyMatrix4(child.matrixWorld);
          wallBoxes.push(box);
        }
      });

      alleyLoaded = true; // <-- Set flag when alley is loaded

      // --- STOP WALKING when alley is loaded ---
      if (walkAction) {
        walkAction.paused = true;
        isWalking = false;
      }
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = false;
      const inEnterZone =
        human && human.position.x < 5 &&
        human.position.x > 0 &&
        human.position.z > 27 &&
        human.position.z < 29;

      if (e.key == 'e' && inEnterZone) {
        onEnterBuilding();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let prevTime = performance.now();
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      const time = performance.now();
      const delta = (time - prevTime) / 1000;
      prevTime = time;

      if (mixer) mixer.update(delta);

      if (human) {
        let moved = false;
        const prevPosition = human.position.clone();

        // Only allow movement if alley is loaded and a movement key is pressed
        let nextPosition = human.position.clone();
        if (alleyLoaded && isAnyMoveKey()) {
          if (keys.s) {
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(human.quaternion);
            nextPosition.add(direction.multiplyScalar(speed));
            moved = true;
          }
          if (keys.w) {
            const direction = new THREE.Vector3(0, 0, 1);
            direction.applyQuaternion(human.quaternion);
            nextPosition.add(direction.multiplyScalar(speed));
            moved = true;
          }
          if (keys.a) {
            human.rotation.y += speed;
            moved = true;
          }
          if (keys.d) {
            human.rotation.y -= speed;
            moved = true;
          }
        }

        // Only update position if inside walls
        if (moved && isInsideWalls(nextPosition)) {
          human.position.copy(nextPosition);
        }

        // Animation control
        if (walkAction && standAction) {
          if (moved && !isWalking) {
            walkAction.reset();
            standAction.paused = true;
            walkAction.paused = false;
            isWalking = true;
          } else if ((!moved || !isAnyMoveKey()) && isWalking) {
            standAction.reset();
            walkAction.paused = true;
            standAction.paused = false;
            // walkAction.time = 0; // <-- Snap to frame 0 (stand pose)
            isWalking = false;
          }
        }

        // Enter zone logic
        const inEnterZone =
          human.position.x < 5 &&
          human.position.x > 0 &&
          human.position.z > 27 &&
          human.position.z < 29;

        // Show/hide enter prompt
        if (enterPromptRef.current) {
          enterPromptRef.current.style.display = inEnterZone ? "block" : "none";
        }

        camera.position.x = human.position.x;
        camera.position.y = human.position.y + 12;
        camera.position.z = human.position.z - 20;
        camera.lookAt(human.position.x, human.position.y + 5, human.position.z);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.dispose();
    };
  }, [onEnterBuilding]);

  return (
    <>
      <canvas ref={canvasRef} className="webgl" />
      {/* Movement Help */}
      <div
        ref={movePromptRef}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "10px 15px",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        Move with: W A S D
      </div>
      {/* Enter Prompt (conditionally shown) */}
      <div
        ref={enterPromptRef}
        style={{
          display: "none", // hidden by default
          position: "absolute",
          bottom: 50,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "8px",
          fontSize: "16px",
        }}
      >
        Press "E" to enter the building
      </div>
    </>
  );
};

export default AlleyScene;
