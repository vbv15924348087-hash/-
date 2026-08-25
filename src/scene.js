import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * 建立调参台需要的场景、相机、灯光、地面和鼠标控制。
 * @param {HTMLElement} container 用来放置 3D 画面的页面元素
 */
export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = null;

  // 背景独立于 3D 画布，压暗并虚化后只提供空间氛围，不与伞争抢视线。
  const background = document.createElement("div");
  background.setAttribute("aria-hidden", "true");
  Object.assign(background.style, {
    position: "absolute",
    inset: "-12px",
    zIndex: "0",
    pointerEvents: "none",
    backgroundImage: `url("${new URL("../assets/misc/hall-bg.png", import.meta.url).href}")`,
    backgroundPosition: "center",
    backgroundSize: "cover",
    filter: "blur(7px) brightness(0.3) saturate(0.65)",
    transform: "scale(1.04)",
  });
  container.prepend(background);

  const camera = new THREE.PerspectiveCamera(
    28,
    container.clientWidth / container.clientHeight,
    0.05,
    100,
  );
  // 相机从斜前下方看向伞面，让逆光透过伞面进入视线。
  camera.position.set(-1.63, 1.3, 9.25);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.position = "relative";
  renderer.domElement.style.zIndex = "1";
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, 2.1, 0);
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  // 接近完整球面环绕，只避开正上方和正下方两个会翻转视角的极点。
  controls.minPolarAngle = 0.01;
  controls.maxPolarAngle = Math.PI - 0.01;

  const mainLight = new THREE.DirectionalLight(0xffe4b8, 6.5);
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
  mainLight.shadow.radius = 4;
  scene.add(mainLight, mainLight.target);

  // 相机侧的冷灰柔光托起伞底纸面，但仍弱于暖色主光，保留明暗层次。
  const fillLight = new THREE.DirectionalLight(0xb8c5c2, 0.55);
  fillLight.name = "fill-light";
  fillLight.position.set(4, 2.5, 4.5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xe2c897, 0.24);
  rimLight.name = "rim-light";
  rimLight.position.set(3.2, 5.2, -4.8);
  rimLight.target.position.set(0, 3.1, 0);
  scene.add(rimLight, rimLight.target);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ color: 0x08100d, opacity: 0.22 }),
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
    rimLight,
  };
}
