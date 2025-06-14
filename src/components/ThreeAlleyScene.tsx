import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const AlleyScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
    gltfLoader.load("/models/alley.glb", (gltf : any) => {
      scene.add(gltf.scene);
    });

    let human: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: THREE.AnimationAction | null = null;
    let isWalking = false;

    const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true; // Optional: smooth motion
    // Load Human FBX
    const fbxLoader = new FBXLoader();
    fbxLoader.load("/models/Walking.fbx", (object : any) => {
      human = object;
      human.scale.set(0.04, 0.04, 0.04);
      human.position.set(0, -12.8, 0);
      scene.add(human);

      mixer = new THREE.AnimationMixer(human);

      if (object.animations && object.animations.length > 0) {
        console.log("animation");
        console.log(object.animations);
        walkAction = mixer.clipAction(object.animations[0]);
        walkAction.play();
        walkAction.paused = false; // Start paused
      } else {
        console.warn("No animations found in FBX file.");
      }

      console.log("Mixer:", mixer);
      console.log("Walk Action:", walkAction);
      console.log("Animations:", object.animations);
    });

    const keys = { w: false, a: false, s: false, d: false };
    const speed = 0.1; // Adjust as needed
    // const clock = new THREE.Clock();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // const isAnyKeyPressed = () => keys.w || keys.a || keys.s || keys.d;

    // Animation loop
    let prevTime = performance.now();
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Add this line
      const time = performance.now();
      const delta = (time - prevTime) / 1000;
      prevTime = time;

      if (mixer) mixer.update(delta);

      if (human) {
        let moved = false;

        if (keys.s) {
          const direction = new THREE.Vector3(0, 0, -1); // Forward in local space
          direction.applyQuaternion(human.quaternion);   // Rotate direction by human's rotation
          human.position.add(direction.multiplyScalar(speed));
          moved = true;
        }
        if (keys.w) {
          const direction = new THREE.Vector3(0, 0, 1); // Backward in local space
          direction.applyQuaternion(human.quaternion);
          human.position.add(direction.multiplyScalar(speed));
          moved = true;
        }
        if (keys.a) {
          human.rotation.y += speed;
          moved = true;
        // const direction = new THREE.Vector3(0, 0, -1); // Forward in local space
        // direction.applyQuaternion(human.quaternion);   // Rotate direction by human's rotation

        // console.log(direction.multiplyScalar(4))
        }
        if (keys.d) {
          human.rotation.y -= speed;
          moved = true;
        // const direction = new THREE.Vector3(0, 0, -1); // Forward in local space
        // direction.applyQuaternion(human.quaternion);   // Rotate direction by human's rotation

        // console.log(direction.multiplyScalar(4))
        }

        if (walkAction) {
          if (moved && !isWalking) {
            walkAction.paused = false;
            isWalking = true;
          } else if (!moved && isWalking) {
            walkAction.paused = true;
            console.log("walking")
            isWalking = false;
          }
        }

        const direction = new THREE.Vector3(0, 0, -1); // Forward in local space
        direction.applyQuaternion(human.quaternion);   // Rotate direction by human's rotation

        // console.log(direction.multiplyScalar(4))
        camera.position.x = human.position.x + direction.multiplyScalar(4).x;
        camera.position.y = human.position.y + 12;
        camera.position.z = human.position.z + direction.multiplyScalar(4).z;
        // (human.position.x, human.position.y + 12, human.position.z - 16);
        // (human.position.x, human.position.y + 12, human.position.z - 16);
        camera.lookAt(human.position)
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="webgl" />;
};

export default AlleyScene;