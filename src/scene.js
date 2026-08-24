import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * 建立调参台需要的场景、相机、灯光、地面和鼠标控制。
 * @param {HTMLElement} container 用来放置 3D 画面的页面元素
 */
export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x878b8e);

  const camera = new THREE.PerspectiveCamera(
    38,
    container.clientWidth / container.clientHeight,
    0.05,
    100,
  );
  // 相机从斜前下方看向伞面，让逆光透过伞面进入视线。
  camera.position.set(4.2, 0.85, 4.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, 1.65, 0);
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  // 接近完整球面环绕，只避开正上方和正下方两个会翻转视角的极点。
  controls.minPolarAngle = 0.01;
  controls.maxPolarAngle = Math.PI - 0.01;

  const mainLight = new THREE.DirectionalLight(0xfff0d0, 6.5);
  mainLight.name = "main-light";
  mainLight.position.set(-3.25, 7, -5.65);
  mainLight.target.position.set(0, 2.7, 0);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(2048, 2048);
  mainLight.shadow.camera.left = -4.5;
  mainLight.shadow.camera.right = 4.5;
  mainLight.shadow.camera.top = 5;
  mainLight.shadow.camera.bottom = -2;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 18;
  mainLight.shadow.bias = -0.0003;
  mainLight.shadow.normalBias = 0.012;
  mainLight.shadow.radius = 2;
  scene.add(mainLight, mainLight.target);

  const fillLight = new THREE.DirectionalLight(0xdce7ee, 0.55);
  fillLight.name = "fill-light";
  fillLight.position.set(4, 2.5, 4.5);
  scene.add(fillLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
      color: 0x777b7d,
      roughness: 1,
      metalness: 0,
    }),
  );
  ground.name = "ground";
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  resizeObserver.observe(container);

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    scene,
    camera,
    renderer,
    controls,
    ground,
    mainLight,
    fillLight,
  };
}
