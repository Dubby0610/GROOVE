import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface AlleySceneProps {
  onEnterBuilding: () => void;
}

const AlleyScene: React.FC<AlleySceneProps> = ({ onEnterBuilding }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const enterPromptRef = useRef<HTMLDivElement | null>(null);
  const movePromptRef = useRef<HTMLDivElement | null>(null);

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
    camera.position.set(0, 2, 20);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // Load Alley
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("/models/alley.glb", (gltf: any) => {
      scene.add(gltf.scene);
    });

    let human: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: THREE.AnimationAction | null = null;
    let isWalking = false;

    const controls = new OrbitControls(camera, renderer.domElement);

    // Load Human FBX
    const fbxLoader = new FBXLoader();
    fbxLoader.load("/models/Walking.fbx", (object: any) => {
      human = object;
      human.scale.set(0.04, 0.04, 0.04);
      human.position.set(0, -12.8, 0);
      scene.add(human);

      mixer = new THREE.AnimationMixer(human);

      if (object.animations && object.animations.length > 0) {
        walkAction = mixer.clipAction(object.animations[0]);
        walkAction.play();
        walkAction.paused = false;
      } else {
        console.warn("No animations found in FBX file.");
      }
    });

    const keys = { w: false, a: false, s: false, d: false, e: false };
    const speed = 0.1;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = false;
      const inEnterZone =
        human.position.x < 5 &&
        human.position.x > -5 &&
        human.position.z > 25 &&
        human.position.z < 35;


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

        if (keys.s) {
          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(human.quaternion);
          human.position.add(direction.multiplyScalar(speed));
          moved = true;
        }
        if (keys.w) {
          const direction = new THREE.Vector3(0, 0, 1);
          direction.applyQuaternion(human.quaternion);
          human.position.add(direction.multiplyScalar(speed));
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

        // Enter zone logic
        const inEnterZone =
          human.position.x < 5 &&
          human.position.x > -5 &&
          human.position.z > 25 &&
          human.position.z < 35;

        // Show/hide enter prompt
        if (enterPromptRef.current) {
          enterPromptRef.current.style.display = inEnterZone ? "block" : "none";
        }

        // if (keys.e && inEnterZone) {
        //   console.log("go to elebrator!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        //   onEnterBuilding();
        // }

        if (walkAction) {
          if (moved && !isWalking) {
            walkAction.paused = false;
            isWalking = true;
          } else if (!moved && isWalking) {
            walkAction.paused = true;
            isWalking = false;
          }
        }

        camera.position.x = human.position.x;
        camera.position.y = human.position.y + 12;
        camera.position.z = human.position.z - 20;
        camera.lookAt(human.position);
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
