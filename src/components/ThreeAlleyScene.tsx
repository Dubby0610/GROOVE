import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface AlleySceneProps {
  onEnterBuilding: () => void;
  onLoaded?: () => void;
}

const AlleyScene: React.FC<AlleySceneProps> = ({ onEnterBuilding, onLoaded }) => {
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

  // Add a state to track if in enter zone
  const [inEnterZone, setInEnterZone] = React.useState(false);

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
      100
    );
    camera.position.set(-10.5, 7, -32); // Fixed position
    camera.lookAt(0, 15, 25); // Fixed target

    let human: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: THREE.AnimationAction | null = null;
    let standAction: THREE.AnimationAction | null = null;
    let isWalking = false;
    let alleyLoaded = false;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false;

    const keys = { w: false, a: false, s: false, d: false, e: false };
    const speed = 0.08;

    const isAnyMoveKey = () => keys.w || keys.a || keys.s || keys.d;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // Load Alley and Human together
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let actions: { [key: string]: THREE.AnimationAction } = {};
    let wallBoxes: THREE.Box3[] = [];

    function playOnly(actionName: string) {
      Object.entries(actions).forEach(([name, action]) => {
        if (name === actionName) {
          action.enabled = true;
          action.fadeIn(0.2);
          action.reset();
          action.play();
        } else {
          action.fadeOut(0.2);
        }
      });
    }

    // Helper to load a GLTF as a Promise
    function loadGLTF(url: string): Promise<any> {
      return new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });
    }

    // Load both models in parallel
    Promise.all([
      loadGLTF("/models/alley-draco.glb"),
      loadGLTF("/models/human-draco.glb")
    ]).then(([alleyGltf, humanGltf]) => {
      // --- Add alley model ---
      scene.add(alleyGltf.scene);
      // Find wall meshes and compute bounding boxes
      alleyGltf.scene.traverse((child: any) => {
        if (child.isMesh && child.name.toLowerCase().includes("wall")) {
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox.clone();
          box.applyMatrix4(child.matrixWorld);
          wallBoxes.push(box);
        }
      });
      alleyLoaded = true;

      // --- Add human model ---
      human = humanGltf.scene;
      human.scale.set(3, 3, 3);
      human.position.set(0, -11.5, -10);
      scene.add(human);
      // Fix materials (for hair, transparency, etc.)
      human.traverse((child: any) => {
        if ((child as any).isMesh && (child as any).material) {
          const mat = (child as any).material;
          mat.needsUpdate = true;
          if (mat.transparent) {
            mat.depthWrite = false;
          }
          if (mat.map) {
            mat.map.encoding = THREE.sRGBEncoding;
            mat.map.needsUpdate = true;
          }
        }
      });
      mixer = new THREE.AnimationMixer(human);
      // Setup all actions, paused by default
      humanGltf.animations.forEach((clip: THREE.AnimationClip) => {
        actions[clip.name] = mixer!.clipAction(clip);
        actions[clip.name].paused = true;
      });
      // Start with Standing
      playOnly("Standing");
      if (typeof onLoaded === 'function') onLoaded();
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

      // Only update position if inside walls
      if (human) {
        let moved = false;
        const prevPosition = human.position.clone();

        // Only allow movement if alley is loaded and a movement key is pressed
        let nextPosition = human.position.clone();
        if (alleyLoaded && isAnyMoveKey()) {
          if (keys.s) {
            // Turn 180 degrees before moving backward
            const originalY = human.rotation.y;
            human.rotation.y += Math.PI;
            const direction = new THREE.Vector3(0, 0, 1);
            direction.applyQuaternion(human.quaternion);
            nextPosition.add(direction.multiplyScalar(speed));
            human.rotation.y = originalY; // Restore original orientation
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

        if (moved && isInsideWalls(nextPosition)) {
          human.position.copy(nextPosition);
        }

        // Animation control
        if (actions["Walking"] && actions["Standing"]) {
          if (moved && !isWalking) {
            playOnly("Walking");
            isWalking = true;
          } else if ((!moved || !isAnyMoveKey()) && isWalking) {
            playOnly("Standing");
            isWalking = false;
          }
        }

        // Enter zone logic
        const nowInEnterZone =
          human.position.x < 5 &&
          human.position.x > 0 &&
          human.position.z > 27 &&
          human.position.z < 29;
        setInEnterZone(nowInEnterZone);
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
      {/* Single Guide at Center-Bottom */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 40,
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "12px 24px",
          borderRadius: "10px",
          fontSize: "16px",
          letterSpacing: "0.1em",
          boxShadow: "0 2px 16px 0 rgba(0,0,0,0.25)",
          fontWeight: 600,
          display: inEnterZone ? "block" : "block",
        }}
      >
        {inEnterZone ? 'Press "E" to enter' : 'Move with: W A S D'}
      </div>
    </>
  );
};

export default AlleyScene;
