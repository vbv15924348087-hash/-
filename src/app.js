import * as THREE from "three";
import { createUmbrella } from "./umbrella.js?v=20260824-live-geometry";
import { createScene } from "./scene.js?v=20260824-ribs";

const umbrellaList = document.querySelector("#umbrella-list");
const catalogStatus = document.querySelector("#catalog-status");
const stageElement = document.querySelector("#stage");
const ribCountInput = document.querySelector("#rib-count");
const ribLengthInput = document.querySelector("#rib-length");
const canopyRiseInput = document.querySelector("#canopy-rise");
const openAmountInput = document.querySelector("#open-amount");
const shaftLengthInput = document.querySelector("#shaft-length");
const transmissionInput = document.querySelector("#transmission");
const roughnessInput = document.querySelector("#roughness");
const canopyColorInput = document.querySelector("#canopy-color");
const canopyTextureInput = document.querySelector("#canopy-texture");
const ribColorInput = document.querySelector("#rib-color");
const mainLightAngleInput = document.querySelector("#main-light-angle");
const mainLightTiltInput = document.querySelector("#main-light-tilt");
const mainLightSpreadInput = document.querySelector("#main-light-spread");
const mainLightIntensityInput = document.querySelector("#main-light-intensity");
const mainLightAngleValue = document.querySelector("#main-light-angle-value");
const mainLightTiltValue = document.querySelector("#main-light-tilt-value");
const mainLightSpreadValue = document.querySelector("#main-light-spread-value");
const mainLightIntensityValue = document.querySelector("#main-light-intensity-value");
const ribCountValue = document.querySelector("#rib-count-value");
const ribLengthValue = document.querySelector("#rib-length-value");
const canopyRiseValue = document.querySelector("#canopy-rise-value");
const openAmountValue = document.querySelector("#open-amount-value");
const shaftLengthValue = document.querySelector("#shaft-length-value");
const transmissionValue = document.querySelector("#transmission-value");
const roughnessValue = document.querySelector("#roughness-value");
const canopyColorValue = document.querySelector("#canopy-color-value");
const ribColorValue = document.querySelector("#rib-color-value");
const stageControls = document.querySelector(".stage-controls");
const stageControlsToggle = document.querySelector("#stage-controls-toggle");
const cultureTabs = [...document.querySelectorAll(".culture__tab")];
const shapePanel = document.querySelector("#shape-panel");
const craftPanel = document.querySelector("#craft-panel");
const patternPanel = document.querySelector("#pattern-panel");
const museumLayout = document.querySelector(".museum-layout");
const catalogPanel = document.querySelector(".catalog");
const culturePanel = document.querySelector(".culture");
const catalogTrigger = document.querySelector("#catalog-trigger");
const catalogClose = document.querySelector("#catalog-close");
const cultureTrigger = document.querySelector("#culture-trigger");
const cultureClose = document.querySelector("#culture-close");
const fullscreenTrigger = document.querySelector("#fullscreen-trigger");
const entranceScene = document.querySelector("#entrance-scene");
const entranceGate = document.querySelector("#entrance-gate");
const awakeningScene = document.querySelector("#awakening-scene");
const awakeningGrip = document.querySelector("#awakening-grip");
const awakeningPattern = document.querySelector("#awakening-pattern");
const collectionHallUi = document.querySelector("#collection-hall-ui");
const collectionCaptionName = document.querySelector("#collection-caption-name");
const collectionCaptionOrigin = document.querySelector("#collection-caption-origin");
const collectionRevealBlackout = document.querySelector("#collection-reveal-blackout");
const loadingScreen = document.querySelector("#loading-screen");
const loadingBar = document.querySelector("#loading-screen__bar");
const loadingLabel = document.querySelector("#loading-screen__label");

const stage = createScene(stageElement);
const stageBackground = stageElement.firstElementChild;
const stageBackgroundDefaultFilter = stageBackground?.style.filter || "";
const stageBackgroundDefaultOpacity = stageBackground?.style.opacity || "";
const isMobileLayout = window.matchMedia("(max-width: 700px)").matches;

// 加载提示：资源就绪前先显示进度，避免白屏空等；完成后淡出。
let loadingDismissed = false;
const loadingStartedAt = performance.now();

function setLoadingProgress(percent, label) {
  if (loadingBar) loadingBar.style.width = `${Math.round(percent)}%`;
  if (label && loadingLabel) loadingLabel.textContent = label;
}

function dismissLoadingScreen() {
  if (loadingDismissed || !loadingScreen) return;
  loadingDismissed = true;
  // 至少停留片刻，避免加载过快时提示一闪而过。
  const remaining = Math.max(0, 420 - (performance.now() - loadingStartedAt));
  window.setTimeout(() => {
    loadingScreen.classList.add("is-done");
    window.setTimeout(() => loadingScreen.remove(), 520);
  }, remaining);
}

// 四盏不投影的弱辅光模拟一盏更宽的博物馆柔光箱。
// 主光仍负责阴影，辅光只负责扩大伞面的受光范围。
const wideLightOffsets = [-1, -0.35, 0.35, 1];
const wideMainLights = wideLightOffsets.map((offset, index) => {
  const light = new THREE.DirectionalLight(stage.mainLight.color, 0);
  light.name = `wide-main-light-${index + 1}`;
  light.target = stage.mainLight.target;
  stage.scene.add(light);
  return light;
});

if (isMobileLayout) {
  stage.camera.position.set(6.8, 1.7, 8);
  stageControls.classList.add("is-collapsed");
  stageControlsToggle.setAttribute("aria-expanded", "false");
  stageControlsToggle.setAttribute("aria-label", "展开古伞控制");
}

const UI_IDLE_DELAY = 4800;
const UI_FIRST_REVEAL_DELAY = 1400;
let uiHideTimer = null;
let fallbackFullscreen = false;

function hasOpenPanel() {
  return document.body.classList.contains("is-catalog-open")
    || document.body.classList.contains("is-culture-open")
    || document.body.classList.contains("is-controls-open");
}

function scheduleInterfaceHide() {
  window.clearTimeout(uiHideTimer);
  if (hasOpenPanel()) return;

  uiHideTimer = window.setTimeout(() => {
    document.body.classList.add("is-ui-dormant");
  }, UI_IDLE_DELAY);
}

function wakeInterface() {
  if (
    document.body.classList.contains("is-entrance-active")
    || document.body.classList.contains("is-awakening-active")
    || document.body.classList.contains("is-collection-intro")
  ) return;
  document.body.classList.remove("is-ui-dormant");
  scheduleInterfaceHide();
}

function setCatalogOpen(isOpen) {
  document.body.classList.toggle("is-catalog-open", isOpen);
  catalogPanel.setAttribute("aria-hidden", String(!isOpen));
  // 关闭时把面板整棵子树移出 Tab 焦点，避免键盘走进看不见的目录按钮。
  catalogPanel.inert = !isOpen;
}

function setCultureOpen(isOpen) {
  document.body.classList.toggle("is-culture-open", isOpen);
  culturePanel.setAttribute("aria-hidden", String(!isOpen));
  culturePanel.inert = !isOpen;
}

function setControlsOpen(isOpen) {
  document.body.classList.toggle("is-controls-open", isOpen);
  stageControls.classList.toggle("is-collapsed", !isOpen);
  stageControlsToggle.setAttribute("aria-expanded", String(isOpen));
  stageControlsToggle.setAttribute(
    "aria-label",
    isOpen ? "收起古伞总控台" : "展开古伞总控台",
  );
  stageControlsToggle.title = isOpen ? "收起设置" : "展开设置";
  stageControlsToggle.textContent = isOpen ? "收" : "调";
}

function closePanels(except = null) {
  if (except !== "catalog") setCatalogOpen(false);
  if (except !== "culture") setCultureOpen(false);
  if (except !== "controls") setControlsOpen(false);
}

function openPanel(name) {
  wakeInterface();
  closePanels(name);

  if (name === "catalog") setCatalogOpen(true);
  if (name === "culture") setCultureOpen(true);
  if (name === "controls") setControlsOpen(true);
  window.clearTimeout(uiHideTimer);
}

function closePanel(name) {
  if (name === "catalog") setCatalogOpen(false);
  if (name === "culture") setCultureOpen(false);
  if (name === "controls") setControlsOpen(false);
  wakeInterface();
}

function updateFullscreenState() {
  const isFullscreen = Boolean(document.fullscreenElement) || fallbackFullscreen;
  document.body.classList.toggle("is-fullscreen-view", isFullscreen);
  fullscreenTrigger.setAttribute(
    "aria-label",
    isFullscreen ? "退出全屏展示" : "进入全屏展示",
  );
  fullscreenTrigger.title = isFullscreen ? "退出全屏展示" : "进入全屏展示";
  wakeInterface();
}

async function toggleFullscreen() {
  closePanels();

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (museumLayout.requestFullscreen) {
      await museumLayout.requestFullscreen();
    } else {
      fallbackFullscreen = !fallbackFullscreen;
      updateFullscreenState();
    }
  } catch (error) {
    console.warn("浏览器未允许进入全屏，已保留普通沉浸展示。", error);
  }
}

catalogTrigger.addEventListener("click", () => {
  if (collectionMode === "inactive") beginReturnToCollectionHall();
});
catalogClose.addEventListener("click", () => closePanel("catalog"));
cultureTrigger.addEventListener("click", () => openPanel("culture"));
cultureClose.addEventListener("click", () => closePanel("culture"));
stageControlsToggle.addEventListener("click", () => {
  const shouldOpen = stageControls.classList.contains("is-collapsed");
  if (shouldOpen) openPanel("controls");
  else closePanel("controls");
});
fullscreenTrigger.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenState);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || document.fullscreenElement) return;
  closePanels();
  wakeInterface();
});

["pointermove", "pointerdown", "touchstart", "focusin"].forEach((eventName) => {
  document.addEventListener(eventName, wakeInterface, { passive: true });
});

setCatalogOpen(false);
setCultureOpen(false);
setControlsOpen(false);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ENTRANCE_READY_DELAY = prefersReducedMotion ? 120 : 4400;
const ENTRANCE_LIGHT_CUT_DELAY = prefersReducedMotion ? 180 : 4550;
const ENTRANCE_FINISH_DELAY = prefersReducedMotion ? 360 : 6300;
const PRODUCT_UI_REVEAL_DELAY = prefersReducedMotion ? 100 : 800;
let isEnteringMuseum = false;

function prepareMuseumEntrance() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => entranceScene.classList.add("is-awake"));
  });

  window.setTimeout(() => {
    entranceScene.classList.add("is-ready");
    entranceGate.disabled = false;
    entranceGate.focus({ preventScroll: true });
  }, ENTRANCE_READY_DELAY);
}

function enterMuseum() {
  if (isEnteringMuseum || entranceGate.disabled) return;
  isEnteringMuseum = true;
  entranceGate.disabled = true;
  entranceScene.classList.remove("is-ready");
  entranceScene.classList.add("is-entering");

  // 暖光铺满镜头后，撤去入口画面；展厅由同一片光里显现。
  window.setTimeout(() => {
    prepareUmbrellaAwakening();
    entranceScene.classList.add("is-product-reveal");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => entranceScene.classList.add("is-light-clearing"));
    });
  }, ENTRANCE_LIGHT_CUT_DELAY);

  window.setTimeout(() => {
    entranceScene.hidden = true;
    document.body.classList.remove("is-entrance-active");
    document.body.classList.add("is-ui-dormant");
  }, ENTRANCE_FINISH_DELAY);
}

entranceGate.addEventListener("click", enterMuseum);
prepareMuseumEntrance();

const rotationGroup = new THREE.Group();
rotationGroup.position.x = -0.35;
stage.scene.add(rotationGroup);

let umbrellas = [];
let patternCatalog = [];
let selectedUmbrella = null;
let umbrellaModel = null;
let activeCanopyTexture = null;
let pendingCanopyTexture = null;
let patternAlignment = null;
let patternClosing = null;
let patternAngleSearch = null;
let patternOpening = null;
let canopyTintOverride = false;
let rebuildRequest = null;
let openUpdateRequest = null;
let geometryUpdateRequest = null;
let ribCountUpdateTimer = null;
let catalogOpening = null;
let isPatternTransitionPending = false;
let displayedOpenAmount = 1;
let awakeningPhase = "idle";
let awakeningProgress = 0;
let awakeningTargetOpenAmount = 1;
let awakeningMotion = null;
let awakeningDrag = null;
let awakeningFinalCamera = null;
let awakeningFinalTarget = null;
let awakeningFinalLightIntensity = 1;
let collectionMode = "inactive";
let collectionEnvironment = null;
let collectionRing = null;
let collectionItems = [];
let collectionFocusedItem = null;
let collectionMotion = null;
let collectionStartTime = 0;
let collectionPointerBias = 0;
let collectionBaseRotation = 0;
let collectionPreviousFog = null;
let collectionSavedLighting = null;
let collectionPrebuildRequest = null;
let collectionReturnMotion = null;
let collectionRevealFromBlack = false;

const collectionRaycaster = new THREE.Raycaster();
const collectionPointer = new THREE.Vector2();
const COLLECTION_RADIUS = 4.5;
const COLLECTION_ITEM_SCALE = 0.36;
const COLLECTION_UNFOCUSED_OPACITY = 0.42;
const COLLECTION_REVEAL_DURATION = 1100;
const COLLECTION_REVEAL_STAGGER = 360;

const PATTERN_ALIGNMENT_DURATION = 800;
const PATTERN_CLOSING_DURATION = 1400;
const PATTERN_ANGLE_SEARCH_DURATION = 1300;
const PATTERN_OPENING_DURATION = 1500;
const CATALOG_OPENING_DURATION = 1900;
const COLLECTION_CLOSED_REVEAL_DURATION = 1050;
const COLLECTION_CLOSED_HOLD_DURATION = 700;
const COLLECTION_OPENING_DURATION = 2450;
const COLLECTION_RETURN_CLOSING_DURATION = 1850;
const COLLECTION_RETURN_BLACK_HOLD_DURATION = 90;
const COLLECTION_RETURN_HALL_DELAY = 260;
const AWAKENING_ORBIT_DURATION = 1800;
const AWAKENING_ANGLE_HOLD_DURATION = 600;
const AWAKENING_CANOPY_PUSH_DURATION = 1600;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

const PATTERN_PRESENTATIONS = {
  ink: {
    cameraHeightOffset: -0.3,
    cameraOrbitAngle: -4,
    lightIntensityMultiplier: 0.82,
    shadowRadius: 5,
  },
  floralBird: {
    cameraHeightOffset: 2,
    cameraOrbitAngle: 4,
    lightIntensityMultiplier: 1,
    shadowRadius: 5,
  },
  landscape: {
    cameraHeightOffset: 0.15,
    cameraOrbitAngle: 0,
    lightIntensityMultiplier: 0.92,
    shadowRadius: 4,
  },
  neutral: {
    cameraHeightOffset: 0,
    cameraOrbitAngle: 0,
    lightIntensityMultiplier: 0.95,
    shadowRadius: 4,
  },
};

function getPatternPresentation(texturePath) {
  const pattern = patternCatalog.find((item) => item.path === (texturePath || ""));
  return PATTERN_PRESENTATIONS[pattern?.presentation]
    || PATTERN_PRESENTATIONS.neutral;
}

function removeUmbrella() {
  if (!umbrellaModel) return;

  const geometries = new Set();
  const materials = new Set();

  umbrellaModel.traverse((part) => {
    if (part.geometry) geometries.add(part.geometry);

    if (Array.isArray(part.material)) {
      part.material.forEach((material) => materials.add(material));
    } else if (part.material) {
      materials.add(part.material);
    }
  });

  rotationGroup.remove(umbrellaModel);
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  umbrellaModel = null;
}

function syncWideMainLights() {
  const spreadValue = Number(mainLightSpreadInput.value);
  const spreadRatio = spreadValue / 100;
  const lightTarget = stage.mainLight.target.position;
  const baseDirection = stage.mainLight.position.clone().sub(lightTarget);
  const distance = Math.max(baseDirection.length(), 0.01);
  const baseAngle = Math.atan2(baseDirection.x, baseDirection.z);
  const baseTilt = Math.asin(
    THREE.MathUtils.clamp(baseDirection.y / distance, -1, 1),
  );
  const angleSpread = THREE.MathUtils.degToRad(85) * spreadRatio;

  wideMainLights.forEach((light, index) => {
    const angle = baseAngle + wideLightOffsets[index] * angleSpread;
    const horizontalDistance = Math.cos(baseTilt) * distance;

    light.position.set(
      lightTarget.x + Math.sin(angle) * horizontalDistance,
      lightTarget.y + Math.sin(baseTilt) * distance,
      lightTarget.z + Math.cos(angle) * horizontalDistance,
    );
    light.intensity = stage.mainLight.intensity * spreadRatio * 0.22;
  });

  mainLightSpreadValue.textContent = `${Math.round(spreadValue)}%`;
}

function updateMainLightFromControls() {
  const angleValue = Number(mainLightAngleInput.value);
  const tiltValue = Number(mainLightTiltInput.value);
  const intensityValue = Number(mainLightIntensityInput.value);
  const angle = THREE.MathUtils.degToRad(angleValue);
  const tilt = THREE.MathUtils.degToRad(tiltValue);
  const distance = 10;
  const horizontalDistance = Math.cos(tilt) * distance;
  const heightOffset = Math.sin(tilt) * distance;
  const lightTarget = stage.mainLight.target.position;

  stage.mainLight.position.set(
    lightTarget.x + Math.sin(angle) * horizontalDistance,
    lightTarget.y + heightOffset,
    lightTarget.z + Math.cos(angle) * horizontalDistance,
  );
  stage.mainLight.intensity = intensityValue;
  mainLightAngleValue.textContent = `${Math.round(angleValue)}°`;
  mainLightTiltValue.textContent = `${Math.round(tiltValue)}°`;
  mainLightIntensityValue.textContent = intensityValue.toFixed(1);
  syncWideMainLights();
}

function buildUmbrella(openAmountOverride = null, updateFraming = true) {
  if (!selectedUmbrella) return;

  const { geometry, material, lighting } = selectedUmbrella;
  const canopyDrop = 0.5;
  const canopyRadius = Math.sqrt(
    Math.max(geometry.ribLength ** 2 - canopyDrop ** 2, 0.01),
  );

  displayedOpenAmount = openAmountOverride ?? Number(openAmountInput.value);

  removeUmbrella();
  umbrellaModel = createUmbrella({
    ribCount: geometry.ribCount,
    canopyRadius,
    canopyDrop,
    canopyRise: geometry.canopyRise,
    openAmount: displayedOpenAmount,
    shaftLength: geometry.shaftLength,
    canopyTexture: activeCanopyTexture,
    canopyColor: material.canopyColor,
    transmission: material.transmission,
    roughness: material.roughness,
    ribColor: material.ribColor,
  });

  // 有贴图时默认保持图片原色；用户主动改伞面颜色后才叠加染色。
  if (canopyTintOverride) {
    umbrellaModel.getObjectByName("canopy")?.material.color.set(material.canopyColor);
  }

  umbrellaModel.traverse((part) => {
    if (part instanceof THREE.Mesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });

  const bounds = new THREE.Box3().setFromObject(umbrellaModel);
  const size = bounds.getSize(new THREE.Vector3());
  umbrellaModel.position.y = -bounds.min.y;
  rotationGroup.add(umbrellaModel);

  if (updateFraming) {
    // 首屏把整把伞放进画面，视线落在伞身中部，避免伞柄被下沿截断。
    if (isMobileLayout) {
      stage.camera.position.set(6.8, 1.7, 8);
      stage.controls.target.set(0, size.y * 0.48, 0);
    } else {
      // 首屏从斜上方观看伞面，让纹样完整进入视线并承接上方主光。
      stage.camera.position.set(-1.5, 8.3, 8);
      stage.controls.target.set(0, size.y * 0.48 + 0.35, 0);
    }

    // 八把伞尺寸不同：保持首屏的观察角度，只沿当前视线自动退远，
    // 让伞沿、伞尖和手柄在宽屏、方屏和手机上都不会被裁掉。
    const viewDirection = stage.camera.position
      .clone()
      .sub(stage.controls.target);
    const currentDistance = viewDirection.length();
    const verticalHalfFov = THREE.MathUtils.degToRad(stage.camera.fov / 2);
    const stageAspect = Math.max(
      stageElement.clientWidth / Math.max(stageElement.clientHeight, 1),
      0.45,
    );
    const horizontalHalfFov = Math.atan(
      Math.tan(verticalHalfFov) * stageAspect,
    );
    const horizontalFitDistance = (canopyRadius * 1.28)
      / Math.tan(horizontalHalfFov);
    const verticalHalfExtent = Math.max(
      stage.controls.target.y,
      size.y - stage.controls.target.y,
    );
    const verticalFitDistance = (verticalHalfExtent * 1.12)
      / Math.tan(verticalHalfFov);
    const fittedDistance = Math.max(
      currentDistance,
      horizontalFitDistance,
      verticalFitDistance,
    );
    stage.camera.position.copy(
      stage.controls.target
        .clone()
        .add(viewDirection.normalize().multiplyScalar(fittedDistance)),
    );
    stage.controls.update();
    stage.mainLight.target.position.set(0, size.y * 0.76, 0);
  }

  if (lighting) {
    updateMainLightFromControls();
  }
}

function smootherStep(progress) {
  return progress ** 3 * (progress * (progress * 6 - 15) + 10);
}

function setStageBackgroundMood(brightness, saturation) {
  if (!stageBackground) return;
  stageBackground.style.opacity = "1";
  stageBackground.style.filter = `blur(7px) brightness(${brightness}) saturate(${saturation})`;
}

function restoreStageBackgroundMood() {
  if (!stageBackground) return;
  stageBackground.style.opacity = stageBackgroundDefaultOpacity;
  stageBackground.style.filter = stageBackgroundDefaultFilter;
}

// 把手势的三段进度转换成有重量感的真实开合量。
function getAwakeningOpenAmount(progress) {
  if (progress <= 0.3) {
    return awakeningTargetOpenAmount
      * 0.22
      * smootherStep(progress / 0.3);
  }

  if (progress <= 0.7) {
    return awakeningTargetOpenAmount * (
      0.22 + 0.56 * smootherStep((progress - 0.3) / 0.4)
    );
  }

  return awakeningTargetOpenAmount * (
    0.78 + 0.22 * smootherStep((progress - 0.7) / 0.3)
  );
}

function applyAwakeningProgress(progress) {
  if (!umbrellaModel) return;

  awakeningProgress = THREE.MathUtils.clamp(progress, 0, 1);
  displayedOpenAmount = getAwakeningOpenAmount(awakeningProgress);
  umbrellaModel.userData.setOpenAmount(displayedOpenAmount);
  awakeningGrip.setAttribute("aria-valuenow", String(Math.round(awakeningProgress * 100)));

  const lightRatio = THREE.MathUtils.lerp(0.68, 1, awakeningProgress);
  stage.mainLight.intensity = awakeningFinalLightIntensity * lightRatio;
  syncWideMainLights();
}

function prepareUmbrellaAwakening() {
  if (!umbrellaModel || !selectedUmbrella) return false;

  document.body.classList.add("is-awakening-active", "is-ui-dormant");
  awakeningScene.hidden = false;
  awakeningScene.className = "awakening-scene is-approaching";
  awakeningProgress = 0;
  awakeningTargetOpenAmount = Number(selectedUmbrella.geometry.openAmount);
  awakeningFinalCamera = stage.camera.position.clone();
  awakeningFinalTarget = stage.controls.target.clone();
  awakeningFinalLightIntensity = Number(mainLightIntensityInput.value);
  // 转场始终使用真实三维伞面，不再把纹样图片作为二维全屏遮罩。
  awakeningPattern.style.backgroundImage = "none";

  patternAlignment = null;
  patternClosing = null;
  patternAngleSearch = null;
  patternOpening = null;
  catalogOpening = null;
  isPatternTransitionPending = false;
  stage.controls.enabled = false;
  rotationGroup.rotation.set(0, THREE.MathUtils.degToRad(8), 0);
  applyAwakeningProgress(0);

  const focusY = selectedUmbrella.geometry.shaftLength * 0.56;
  const focus = new THREE.Vector3(rotationGroup.position.x, focusY, 0);
  const cameraStart = isMobileLayout
    ? new THREE.Vector3(3.4, focusY + 0.7, 10.3)
    : new THREE.Vector3(-2.15, focusY + 0.75, 10.4);
  const cameraEnd = isMobileLayout
    ? new THREE.Vector3(2.65, focusY + 0.5, 9.1)
    : new THREE.Vector3(-1.55, focusY + 0.45, 8.9);

  stage.camera.position.copy(cameraStart);
  stage.controls.target.copy(focus);
  stage.controls.update();
  stage.mainLight.intensity = awakeningFinalLightIntensity * 0.58;
  syncWideMainLights();

  awakeningPhase = "approaching";
  awakeningMotion = {
    startTime: performance.now(),
    duration: prefersReducedMotion ? 180 : 2400,
    fromCamera: cameraStart,
    toCamera: cameraEnd,
    focus,
  };
  startCollectionHallPrebuild();
  return true;
}

function beginAwakeningPortal(currentTime) {
  if (!umbrellaModel) return;

  awakeningPhase = "portal";
  awakeningScene.classList.remove("is-ready", "is-dragging");
  awakeningScene.classList.add("is-portal");

  // 先找到真实伞面的空间中心，再让镜头绕到能看清纹样的斜上方。
  stage.scene.updateMatrixWorld(true);
  const canopy = umbrellaModel.getObjectByName("canopy") || umbrellaModel;
  const canopyBox = new THREE.Box3().setFromObject(canopy);
  const canopyCenter = canopyBox.getCenter(new THREE.Vector3());
  const canopySize = canopyBox.getSize(new THREE.Vector3());
  const canopyRadius = Math.max(canopySize.x, canopySize.z) * 0.5;
  const portraitDirection = new THREE.Vector3(-0.32, 2.05, 2.35).normalize();
  const orbitCamera = canopyCenter.clone().addScaledVector(
    portraitDirection,
    Math.max(canopyRadius * 3.45, 6.2),
  );
  const closeCamera = canopyCenter.clone().addScaledVector(
    portraitDirection,
    Math.max(canopyRadius * 1.9, 3.4),
  );

  // 藏馆在最后一小段暗场后方提前就位，避免切换时暴露建模卡顿。
  collectionHallUi.hidden = false;
  collectionHallUi.className = "collection-hall-ui is-awakening-bridge";
  collectionRevealBlackout.style.transition = "none";
  collectionRevealBlackout.style.opacity = "0";

  awakeningMotion = {
    startTime: currentTime,
    orbitDuration: prefersReducedMotion ? 220 : AWAKENING_ORBIT_DURATION,
    holdDuration: prefersReducedMotion ? 80 : AWAKENING_ANGLE_HOLD_DURATION,
    pushDuration: prefersReducedMotion ? 220 : AWAKENING_CANOPY_PUSH_DURATION,
    fromCamera: stage.camera.position.clone(),
    orbitCamera,
    closeCamera,
    fromTarget: stage.controls.target.clone(),
    canopyCenter,
    fromRotationY: rotationGroup.rotation.y,
  };
}

function finishAwakeningPortal() {
  // 暗场只负责遮住场景换位；藏馆随后从同一暗部中逐渐苏醒。
  enterCollectionHall(null, true);
  awakeningPhase = "idle";
  awakeningMotion = null;
  awakeningPattern.style.transition = "";
  awakeningPattern.style.opacity = "";
  awakeningPattern.style.transform = "";
  awakeningScene.classList.add("is-clearing");

  window.setTimeout(() => {
    document.body.classList.remove("is-awakening-active");
  }, PRODUCT_UI_REVEAL_DELAY);

  window.setTimeout(() => {
    awakeningScene.hidden = true;
    awakeningScene.className = "awakening-scene";
  }, prefersReducedMotion ? 240 : 1100);
}

function updateAwakeningAnimation(currentTime) {
  if (!awakeningMotion) return;

  if (awakeningPhase === "approaching") {
    const progress = Math.min(
      (currentTime - awakeningMotion.startTime) / awakeningMotion.duration,
      1,
    );
    const easedProgress = smootherStep(progress);
    stage.camera.position.lerpVectors(
      awakeningMotion.fromCamera,
      awakeningMotion.toCamera,
      easedProgress,
    );
    stage.controls.target.copy(awakeningMotion.focus);
    stage.controls.update();
    stage.mainLight.intensity = THREE.MathUtils.lerp(
      awakeningFinalLightIntensity * 0.58,
      awakeningFinalLightIntensity * 0.68,
      easedProgress,
    );
    syncWideMainLights();

    if (progress === 1) {
      awakeningPhase = "ready";
      awakeningMotion = null;
      awakeningScene.classList.add("is-ready");
    }
    return;
  }

  if (awakeningPhase === "finishing") {
    const progress = Math.min(
      (currentTime - awakeningMotion.startTime) / awakeningMotion.duration,
      1,
    );
    applyAwakeningProgress(THREE.MathUtils.lerp(
      awakeningMotion.fromProgress,
      1,
      smootherStep(progress),
    ));

    if (progress === 1) beginAwakeningPortal(currentTime);
    return;
  }

  if (awakeningPhase === "portal") {
    const elapsed = currentTime - awakeningMotion.startTime;
    const orbitEnd = awakeningMotion.orbitDuration;
    const holdEnd = orbitEnd + awakeningMotion.holdDuration;
    const pushEnd = holdEnd + awakeningMotion.pushDuration;
    const orbitAngle = THREE.MathUtils.degToRad(42);

    if (elapsed <= orbitEnd) {
      const progress = THREE.MathUtils.clamp(elapsed / orbitEnd, 0, 1);
      const easedProgress = smootherStep(progress);
      stage.camera.position.lerpVectors(
        awakeningMotion.fromCamera,
        awakeningMotion.orbitCamera,
        easedProgress,
      );
      stage.controls.target.lerpVectors(
        awakeningMotion.fromTarget,
        awakeningMotion.canopyCenter,
        easedProgress,
      );
      rotationGroup.rotation.y = awakeningMotion.fromRotationY
        + orbitAngle * easedProgress;
    } else if (elapsed <= holdEnd) {
      const holdElapsed = elapsed - orbitEnd;
      stage.camera.position.copy(awakeningMotion.orbitCamera);
      stage.controls.target.copy(awakeningMotion.canopyCenter);
      rotationGroup.rotation.y = awakeningMotion.fromRotationY
        + orbitAngle
        + holdElapsed * 0.00018;
    } else {
      const pushElapsed = elapsed - holdEnd;
      const progress = THREE.MathUtils.clamp(
        pushElapsed / awakeningMotion.pushDuration,
        0,
        1,
      );
      const easedProgress = smootherStep(progress);
      stage.camera.position.lerpVectors(
        awakeningMotion.orbitCamera,
        awakeningMotion.closeCamera,
        easedProgress,
      );
      stage.controls.target.copy(awakeningMotion.canopyCenter);
      rotationGroup.rotation.y = awakeningMotion.fromRotationY
        + orbitAngle
        + awakeningMotion.holdDuration * 0.00018
        + pushElapsed * 0.00022;

      // 直到真实伞面已经接近铺满视野才压入暗部，避免再次出现贴图闪屏。
      const blackoutProgress = THREE.MathUtils.clamp((progress - 0.72) / 0.28, 0, 1);
      collectionRevealBlackout.style.opacity = String(smootherStep(blackoutProgress));
    }

    stage.controls.update();
    if (elapsed >= pushEnd) finishAwakeningPortal();
  }
}

function endAwakeningDrag(event) {
  if (!awakeningDrag || event.pointerId !== awakeningDrag.pointerId) return;
  if (awakeningGrip.hasPointerCapture?.(event.pointerId)) {
    awakeningGrip.releasePointerCapture(event.pointerId);
  }
  awakeningDrag = null;
  awakeningScene.classList.remove("is-dragging");

  if (awakeningProgress >= 0.94) {
    applyAwakeningProgress(1);
    beginAwakeningPortal(performance.now());
  } else {
    awakeningPhase = "ready";
    awakeningScene.classList.add("is-ready");
  }
}

awakeningGrip.addEventListener("pointerdown", (event) => {
  if (awakeningPhase !== "ready") return;
  event.preventDefault();
  awakeningDrag = {
    pointerId: event.pointerId,
    startY: event.clientY,
    startProgress: awakeningProgress,
  };
  awakeningPhase = "dragging";
  awakeningScene.classList.remove("is-ready");
  awakeningScene.classList.add("is-dragging");
  try {
    awakeningGrip.setPointerCapture(event.pointerId);
  } catch {
    // 某些辅助输入不会产生原生指针捕获，拖动逻辑仍可继续。
  }
});

awakeningGrip.addEventListener("pointermove", (event) => {
  if (!awakeningDrag || event.pointerId !== awakeningDrag.pointerId) return;
  event.preventDefault();
  const dragDistance = Math.max(window.innerHeight * 0.36, 260);
  const progress = awakeningDrag.startProgress
    + (awakeningDrag.startY - event.clientY) / dragDistance;
  applyAwakeningProgress(progress);
});

awakeningGrip.addEventListener("pointerup", endAwakeningDrag);
awakeningGrip.addEventListener("pointercancel", endAwakeningDrag);
awakeningGrip.addEventListener("keydown", (event) => {
  if (awakeningPhase !== "ready") return;
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  event.preventDefault();
  const direction = event.key === "ArrowUp" ? 1 : -1;
  applyAwakeningProgress(awakeningProgress + direction * 0.05);

  if (awakeningProgress >= 0.99) {
    applyAwakeningProgress(1);
    beginAwakeningPortal(performance.now());
  }
});

function setCollectionModelOpacity(model, opacity) {
  model.traverse((part) => {
    if (!part.material) return;
    const materials = Array.isArray(part.material) ? part.material : [part.material];

    materials.forEach((material) => {
      if (material.userData.collectionBaseOpacity === undefined) {
        material.userData.collectionBaseOpacity = material.opacity;
        material.userData.collectionBaseTransparent = material.transparent;
        material.userData.collectionBaseDepthWrite = material.depthWrite;
      }

      material.opacity = material.userData.collectionBaseOpacity * opacity;
      material.transparent = opacity < 0.999
        || material.userData.collectionBaseTransparent;
      material.depthWrite = opacity > 0.42
        ? material.userData.collectionBaseDepthWrite
        : false;
    });
  });
}

function createCollectionEnvironment() {
  collectionEnvironment = new THREE.Group();
  collectionEnvironment.name = "eight-umbrella-hall";

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9.4, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x171b18,
      roughness: 0.78,
      metalness: 0.08,
      clearcoat: 0.12,
      clearcoatRoughness: 0.8,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  collectionEnvironment.add(floor);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(9.2, 9.2, 5.4, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x181714,
      roughness: 0.96,
      side: THREE.BackSide,
    }),
  );
  wall.position.y = 2.7;
  collectionEnvironment.add(wall);

  // 一盏覆盖整圈藏品的大厅顶光，建立统一且符合空间关系的基础照明。
  const hallLightTarget = new THREE.Object3D();
  hallLightTarget.position.set(0, 0.7, 0);
  collectionEnvironment.add(hallLightTarget);
  const hallLight = new THREE.SpotLight(
    0xffdfaa,
    0,
    26,
    Math.PI / 4.3,
    0.92,
    1.15,
  );
  hallLight.position.set(0, 11.5, 0);
  hallLight.target = hallLightTarget;
  hallLight.castShadow = false;
  collectionEnvironment.add(hallLight);
  collectionEnvironment.userData.hallLight = hallLight;

  const beamMaterial = new THREE.MeshStandardMaterial({
    color: 0x241b14,
    roughness: 0.9,
  });
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.2, 0.32), beamMaterial);
    beam.position.set(Math.cos(angle) * 8.75, 2.6, Math.sin(angle) * 8.75);
    beam.lookAt(0, 2.6, 0);
    collectionEnvironment.add(beam);
  }

  const particlePositions = [];
  for (let index = 0; index < 100; index += 1) {
    const angle = index * 2.39996;
    const radius = 1.8 + (index % 17) * 0.36;
    particlePositions.push(
      Math.cos(angle) * radius,
      0.7 + (index % 23) * 0.18,
      Math.sin(angle) * radius,
    );
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(particlePositions, 3),
  );
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xcabf9d,
      size: 0.025,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  particles.name = "hall-air-particles";
  collectionEnvironment.add(particles);

  stage.scene.add(collectionEnvironment);
}

function createCollectionItem(umbrella, index) {
  const { geometry, material } = umbrella;
  const canopyDrop = 0.5;
  const canopyRadius = Math.sqrt(
    Math.max(geometry.ribLength ** 2 - canopyDrop ** 2, 0.01),
  );
  const model = createUmbrella({
    ribCount: geometry.ribCount,
    canopyRadius,
    canopyDrop,
    canopyRise: geometry.canopyRise,
    openAmount: geometry.openAmount,
    shaftLength: geometry.shaftLength,
    canopyTexture: material.canopyTexture || null,
    canopyColor: material.canopyColor,
    transmission: material.transmission,
    roughness: material.roughness,
    ribColor: material.ribColor,
  });

  model.traverse((part) => {
    if (part instanceof THREE.Mesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y = -bounds.min.y;

  const root = new THREE.Group();
  const angle = -Math.PI / 2 + (index / umbrellas.length) * Math.PI * 2;
  root.position.set(
    Math.cos(angle) * COLLECTION_RADIUS,
    0.18,
    Math.sin(angle) * COLLECTION_RADIUS,
  );
  root.rotation.y = -angle - Math.PI / 2;
  root.scale.setScalar(0.001);
  root.add(model);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.82, 0.22, 32),
    new THREE.MeshStandardMaterial({ color: 0x282722, roughness: 0.84 }),
  );
  plinth.position.y = -0.07;
  plinth.receiveShadow = true;
  root.add(plinth);

  // 单伞灯只在被关注时开启；灯位不跟随缩放，确保光面覆盖整把伞。
  const light = new THREE.SpotLight(
    0xffe7bd,
    0,
    16,
    Math.PI / 9,
    0.9,
    1.05,
  );
  light.position.set(root.position.x, 8.2, root.position.z);
  light.target = root;
  light.castShadow = false;

  const item = {
    umbrella,
    root,
    model,
    light,
    index,
    revealProgress: 0,
    opacity: 0,
  };
  root.userData.collectionItem = item;
  model.userData.collectionItem = item;
  setCollectionModelOpacity(model, 0);
  return item;
}

function addNextPrebuiltCollectionItem() {
  collectionPrebuildRequest = null;
  if (!collectionRing || collectionMode !== "inactive") return;

  const index = collectionItems.length;
  if (index >= umbrellas.length) return;

  const item = createCollectionItem(umbrellas[index], index);
  collectionItems.push(item);
  collectionRing.add(item.root);
  collectionRing.add(item.light);
  collectionPrebuildRequest = requestAnimationFrame(addNextPrebuiltCollectionItem);
}

function startCollectionHallPrebuild() {
  if (collectionRing || !umbrellas.length) return;

  createCollectionEnvironment();
  collectionEnvironment.visible = false;
  collectionRing = new THREE.Group();
  collectionRing.name = "collection-ring";
  collectionRing.visible = false;
  collectionItems = [];
  stage.scene.add(collectionRing);
  collectionPrebuildRequest = requestAnimationFrame(addNextPrebuiltCollectionItem);
}

function finishCollectionHallPrebuild() {
  if (collectionPrebuildRequest !== null) {
    cancelAnimationFrame(collectionPrebuildRequest);
    collectionPrebuildRequest = null;
  }

  if (!collectionEnvironment) {
    createCollectionEnvironment();
    collectionEnvironment.visible = false;
  }
  if (!collectionRing) {
    collectionRing = new THREE.Group();
    collectionRing.name = "collection-ring";
    collectionRing.visible = false;
    collectionItems = [];
    stage.scene.add(collectionRing);
  }

  while (collectionItems.length < umbrellas.length) {
    const index = collectionItems.length;
    const item = createCollectionItem(umbrellas[index], index);
    collectionItems.push(item);
    collectionRing.add(item.root);
    collectionRing.add(item.light);
  }
}

function enterCollectionHall(savedLighting = null, revealFromBlack = false) {
  removeUmbrella();
  closePanels();
  collectionPreviousFog = stage.scene.fog;
  collectionSavedLighting = savedLighting || {
    main: stage.mainLight.intensity,
    fill: stage.fillLight.intensity,
    rim: stage.rimLight.intensity,
    groundVisible: stage.ground.visible,
    maxDistance: stage.controls.maxDistance,
  };

  stage.scene.fog = new THREE.FogExp2(0x101715, 0.038);
  stage.ground.visible = false;
  stage.mainLight.intensity = 0.28;
  stage.fillLight.intensity = 0.08;
  stage.rimLight.intensity = 0.04;
  syncWideMainLights();

  finishCollectionHallPrebuild();
  collectionEnvironment.visible = true;
  collectionRing.visible = true;
  collectionItems.forEach((item) => {
    item.revealProgress = 0;
    item.opacity = 0;
    item.model.userData.setOpenAmount(0);
    item.root.scale.setScalar(COLLECTION_ITEM_SCALE * 0.94);
    setCollectionModelOpacity(item.model, 0);
    item.light.intensity = 0;
  });

  // 先给出大厅全貌：从中心外侧略高处观看，能同时读到环形展位的前后层次。
  stage.controls.maxDistance = 30;
  stage.camera.position.set(0, 20, 11);
  stage.controls.target.set(0, 0.65, 0);
  stage.controls.update();
  stage.controls.enabled = false;

  collectionHallUi.hidden = false;
  collectionHallUi.className = "collection-hall-ui";
  collectionRevealFromBlack = revealFromBlack;
  if (revealFromBlack) {
    collectionRevealBlackout.style.transition = "none";
    collectionRevealBlackout.style.opacity = "1";
  }
  document.body.classList.add(
    "is-collection-hall",
    "is-collection-intro",
    "is-ui-dormant",
  );
  collectionMode = "revealing";
  collectionStartTime = performance.now()
    + (revealFromBlack ? COLLECTION_RETURN_HALL_DELAY : 0);
  collectionFocusedItem = null;
  collectionPointerBias = 0;
  collectionBaseRotation = 0;
}

function beginReturnToCollectionHall() {
  if (collectionMode !== "inactive" || collectionReturnMotion) return;
  if (!umbrellaModel) {
    enterCollectionHall();
    return;
  }

  closePanels();
  document.body.classList.add("is-collection-intro", "is-ui-dormant");
  collectionHallUi.hidden = false;
  collectionHallUi.className = "collection-hall-ui is-returning";
  collectionRevealBlackout.style.transition = "none";
  collectionRevealBlackout.style.opacity = "0";
  stage.controls.enabled = false;

  catalogOpening = null;
  patternAlignment = null;
  patternClosing = null;
  patternAngleSearch = null;
  patternOpening = null;
  isPatternTransitionPending = false;

  collectionReturnMotion = {
    startTime: performance.now(),
    fromOpenAmount: displayedOpenAmount,
    fromMainLightIntensity: stage.mainLight.intensity,
    fromFillLightIntensity: stage.fillLight.intensity,
    fromRimLightIntensity: stage.rimLight.intensity,
    savedLighting: {
      main: stage.mainLight.intensity,
      fill: stage.fillLight.intensity,
      rim: stage.rimLight.intensity,
      groundVisible: stage.ground.visible,
      maxDistance: stage.controls.maxDistance,
    },
    blackReachedAt: null,
  };
}

function updateReturnToCollectionHall(currentTime) {
  if (!collectionReturnMotion || !umbrellaModel) return;
  const elapsed = currentTime - collectionReturnMotion.startTime;
  const progress = THREE.MathUtils.clamp(
    elapsed / COLLECTION_RETURN_CLOSING_DURATION,
    0,
    1,
  );
  const easedProgress = smootherStep(progress);

  displayedOpenAmount = THREE.MathUtils.lerp(
    collectionReturnMotion.fromOpenAmount,
    0,
    easedProgress,
  );
  umbrellaModel.userData.setOpenAmount(displayedOpenAmount);
  stage.mainLight.intensity = THREE.MathUtils.lerp(
    collectionReturnMotion.fromMainLightIntensity,
    0,
    easedProgress,
  );
  stage.fillLight.intensity = THREE.MathUtils.lerp(
    collectionReturnMotion.fromFillLightIntensity,
    0,
    easedProgress,
  );
  stage.rimLight.intensity = THREE.MathUtils.lerp(
    collectionReturnMotion.fromRimLightIntensity,
    0,
    easedProgress,
  );
  syncWideMainLights();
  setStageBackgroundMood(
    THREE.MathUtils.lerp(0.3, 0.045, easedProgress),
    THREE.MathUtils.lerp(0.65, 0.5, easedProgress),
  );

  const blackoutProgress = THREE.MathUtils.clamp((progress - 0.28) / 0.72, 0, 1);
  collectionRevealBlackout.style.opacity = String(smootherStep(blackoutProgress));

  if (progress < 1) return;
  if (collectionReturnMotion.blackReachedAt === null) {
    collectionReturnMotion.blackReachedAt = currentTime;
    collectionRevealBlackout.style.opacity = "1";
    return;
  }
  if (
    currentTime - collectionReturnMotion.blackReachedAt
    < COLLECTION_RETURN_BLACK_HOLD_DURATION
  ) return;

  const savedLighting = collectionReturnMotion.savedLighting;
  collectionReturnMotion = null;
  enterCollectionHall(savedLighting, true);
}

function disposeObjectTree(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((part) => {
    if (part.geometry) geometries.add(part.geometry);
    if (!part.material) return;
    const partMaterials = Array.isArray(part.material) ? part.material : [part.material];
    partMaterials.forEach((material) => {
      materials.add(material);
      if (material.map) textures.add(material.map);
    });
  });
  textures.forEach((texture) => texture.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function removeCollectionHall() {
  if (collectionPrebuildRequest !== null) {
    cancelAnimationFrame(collectionPrebuildRequest);
    collectionPrebuildRequest = null;
  }
  if (collectionRing) {
    stage.scene.remove(collectionRing);
    disposeObjectTree(collectionRing);
  }
  if (collectionEnvironment) {
    stage.scene.remove(collectionEnvironment);
    disposeObjectTree(collectionEnvironment);
  }

  collectionRing = null;
  collectionEnvironment = null;
  collectionItems = [];
  collectionFocusedItem = null;
  stage.scene.fog = collectionPreviousFog;
  stage.ground.visible = collectionSavedLighting?.groundVisible ?? true;
  stage.controls.maxDistance = collectionSavedLighting?.maxDistance ?? 12;
  stage.fillLight.intensity = collectionSavedLighting?.fill ?? 0.55;
  stage.rimLight.intensity = collectionSavedLighting?.rim ?? 0.24;
}

function focusCollectionItem(item) {
  if (collectionFocusedItem === item) return;
  collectionFocusedItem = item;
  collectionHallUi.classList.toggle("has-focus", Boolean(item));
  collectionCaptionName.textContent = item?.umbrella.name || "";
  collectionCaptionOrigin.textContent = item?.umbrella.origin
    || item?.umbrella.alias
    || "";
}

function getCollectionItemAt(clientX, clientY) {
  if (!collectionRing || collectionMode !== "active") return null;
  const canvas = stage.renderer.domElement;
  const rect = canvas.getBoundingClientRect();
  collectionPointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  collectionPointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  collectionRaycaster.setFromCamera(collectionPointer, stage.camera);
  const intersections = collectionRaycaster.intersectObject(collectionRing, true);

  for (const intersection of intersections) {
    let current = intersection.object;
    while (current && current !== collectionRing) {
      if (current.userData.collectionItem) return current.userData.collectionItem;
      current = current.parent;
    }
  }
  return null;
}

function beginCollectionSelection(umbrella) {
  if (collectionMode !== "active") return;
  const item = collectionItems.find((candidate) => candidate.umbrella.id === umbrella.id);
  if (!item) return;

  focusCollectionItem(item);
  collectionMode = "selecting";
  document.body.classList.add("is-collection-intro", "is-ui-dormant");
  collectionHallUi.classList.remove("is-ready");
  const worldPosition = item.root.getWorldPosition(new THREE.Vector3());
  const inwardDirection = worldPosition.clone().setY(0).normalize();
  const cameraDestination = worldPosition
    .clone()
    .addScaledVector(inwardDirection, -2.55)
    .setY(3.25);
  const targetDestination = worldPosition.clone().setY(2.2);

  collectionMotion = {
    item,
    startTime: performance.now(),
    duration: prefersReducedMotion ? 220 : 1900,
    fromCamera: stage.camera.position.clone(),
    toCamera: cameraDestination,
    fromTarget: stage.controls.target.clone(),
    toTarget: targetDestination,
    lightCutStarted: false,
    blackoutStarted: false,
  };
}

function finishCollectionSelection() {
  const umbrella = collectionMotion.item.umbrella;
  const button = umbrellaList.querySelector(`[data-umbrella-id="${umbrella.id}"]`);
  collectionHallUi.classList.add("is-clearing", "is-blackout");
  removeCollectionHall();
  collectionMode = "inactive";
  collectionMotion = null;
  document.body.classList.remove("is-collection-hall");
  rotationGroup.visible = true;
  selectedUmbrella = null;
  selectUmbrella(button, umbrella, {
    forceOpening: true,
    revealFromCollection: true,
  });
}

function updateCollectionHall(currentTime, elapsedSeconds) {
  if (!collectionRing) return;
  collectionEnvironment?.getObjectByName("hall-air-particles")?.rotateY(elapsedSeconds * 0.015);

  if (collectionMode === "revealing") {
    if (collectionRevealFromBlack) {
      const blackoutProgress = THREE.MathUtils.clamp(
        (currentTime - collectionStartTime) / 920,
        0,
        1,
      );
      collectionRevealBlackout.style.opacity = String(1 - smootherStep(blackoutProgress));
      if (blackoutProgress === 1) {
        collectionRevealFromBlack = false;
        collectionRevealBlackout.style.transition = "";
        collectionRevealBlackout.style.opacity = "";
      }
    }
    const hallLight = collectionEnvironment?.userData.hallLight;
    if (hallLight) {
      const lightProgress = THREE.MathUtils.clamp(
        (currentTime - collectionStartTime) / 1800,
        0,
        1,
      );
      hallLight.intensity = THREE.MathUtils.lerp(0, 115, smootherStep(lightProgress));
    }
    collectionItems.forEach((item) => {
      const delay = item.index * COLLECTION_REVEAL_STAGGER;
      const progress = THREE.MathUtils.clamp(
        (currentTime - collectionStartTime - delay) / COLLECTION_REVEAL_DURATION,
        0,
        1,
      );
      const easedProgress = smootherStep(progress);
      item.revealProgress = easedProgress;
      item.opacity = easedProgress;
      item.model.userData.setOpenAmount(
        Number(item.umbrella.geometry.openAmount) * easedProgress,
      );
      item.root.scale.setScalar(
        THREE.MathUtils.lerp(
          COLLECTION_ITEM_SCALE * 0.94,
          COLLECTION_ITEM_SCALE,
          easedProgress,
        ),
      );
      setCollectionModelOpacity(item.model, easedProgress);
      item.light.intensity = 0;
    });

    const totalDuration = COLLECTION_REVEAL_DURATION
      + (collectionItems.length - 1) * COLLECTION_REVEAL_STAGGER;
    if (currentTime - collectionStartTime >= totalDuration) {
      collectionMode = "active";
      collectionHallUi.classList.add("is-ready");
      document.body.classList.remove("is-collection-intro");
      window.setTimeout(wakeInterface, 700);
    }
    return;
  }

  if (collectionMode === "selecting" && collectionMotion) {
    const progress = Math.min(
      (currentTime - collectionMotion.startTime) / collectionMotion.duration,
      1,
    );
    const easedProgress = smootherStep(progress);
    stage.camera.position.lerpVectors(
      collectionMotion.fromCamera,
      collectionMotion.toCamera,
      easedProgress,
    );
    stage.controls.target.lerpVectors(
      collectionMotion.fromTarget,
      collectionMotion.toTarget,
      easedProgress,
    );
    stage.controls.update();

    collectionItems.forEach((item) => {
      const isSelected = item === collectionMotion.item;
      const opacity = isSelected ? 1 : 1 - easedProgress;
      setCollectionModelOpacity(item.model, opacity);
      item.light.intensity = THREE.MathUtils.lerp(
        item.light.intensity,
        isSelected ? 145 : 0,
        0.08,
      );
      if (isSelected) {
        item.root.scale.setScalar(COLLECTION_ITEM_SCALE + easedProgress * 0.045);
      }
    });

    if (progress > 0.52 && !collectionMotion.lightCutStarted) {
      collectionMotion.lightCutStarted = true;
      collectionHallUi.classList.add("is-entering-item");
    }
    if (progress > 0.56 && !collectionMotion.blackoutStarted) {
      collectionMotion.blackoutStarted = true;
      collectionHallUi.classList.add("is-blackout");
    }
    if (progress === 1) finishCollectionSelection();
    return;
  }

  if (!prefersReducedMotion) {
    collectionBaseRotation += elapsedSeconds * 0.025;
  }
  collectionRing.rotation.y += (
    collectionBaseRotation + collectionPointerBias - collectionRing.rotation.y
  ) * 0.025;
  collectionItems.forEach((item) => {
    const isFocused = item === collectionFocusedItem;
    const targetOpacity = !collectionFocusedItem || isFocused
      ? 1
      : COLLECTION_UNFOCUSED_OPACITY;
    item.opacity += (targetOpacity - item.opacity) * 0.085;
    setCollectionModelOpacity(item.model, item.opacity);
    item.light.intensity += ((isFocused ? 145 : 0) - item.light.intensity) * 0.075;
    if (!prefersReducedMotion) {
      item.model.rotation.y += elapsedSeconds * (isFocused ? 0.22 : 0.035);
    }
  });
}

stage.renderer.domElement.addEventListener("pointermove", (event) => {
  if (collectionMode !== "active") return;
  collectionPointerBias = THREE.MathUtils.clamp(
    -((event.clientX / window.innerWidth) - 0.5) * 0.45,
    -0.23,
    0.23,
  );
  focusCollectionItem(getCollectionItemAt(event.clientX, event.clientY));
});

stage.renderer.domElement.addEventListener("pointerleave", () => {
  if (collectionMode === "active") focusCollectionItem(null);
});

stage.renderer.domElement.addEventListener("click", (event) => {
  const item = getCollectionItemAt(event.clientX, event.clientY);
  if (item) beginCollectionSelection(item.umbrella);
});

function updateOpenAmountFromControl() {
  if (!umbrellaModel) return;

  // 手动开合优先：停止正在进行的纹样仪式，但保留用户当前观察视角。
  const wasPatternTransitionPending = isPatternTransitionPending;
  catalogOpening = null;
  patternAlignment = null;
  patternClosing = null;
  patternAngleSearch = null;
  patternOpening = null;
  isPatternTransitionPending = false;
  stage.controls.enabled = true;

  // 如果新纹样尚未真正换入，恢复下拉框与当前伞面的一致状态。
  if (
    wasPatternTransitionPending
    && pendingCanopyTexture !== activeCanopyTexture
  ) {
    canopyTextureInput.value = activeCanopyTexture || "";
  }
  pendingCanopyTexture = null;

  displayedOpenAmount = Number(openAmountInput.value);
  openAmountValue.textContent = displayedOpenAmount.toFixed(2);

  // 连续拖动时只在下一帧应用最新数值，避免旧计算排队造成顿挫。
  if (openUpdateRequest !== null) return;
  openUpdateRequest = requestAnimationFrame(() => {
    openUpdateRequest = null;
    if (umbrellaModel) {
      umbrellaModel.userData.setOpenAmount(displayedOpenAmount);
    }
  });
}

function updateParameterOutputs() {
  ribCountValue.textContent = String(Math.round(Number(ribCountInput.value)));
  ribLengthValue.textContent = Number(ribLengthInput.value).toFixed(2);
  canopyRiseValue.textContent = Number(canopyRiseInput.value).toFixed(2);
  openAmountValue.textContent = Number(openAmountInput.value).toFixed(2);
  shaftLengthValue.textContent = Number(shaftLengthInput.value).toFixed(2);
  transmissionValue.textContent = Number(transmissionInput.value).toFixed(2);
  roughnessValue.textContent = Number(roughnessInput.value).toFixed(2);
  canopyColorValue.textContent = canopyColorInput.value.toUpperCase();
  ribColorValue.textContent = ribColorInput.value.toUpperCase();
}

function copyControlsToSelectedUmbrella() {
  if (!selectedUmbrella) return;

  selectedUmbrella.geometry.ribCount = Math.round(Number(ribCountInput.value));
  selectedUmbrella.geometry.ribLength = Number(ribLengthInput.value);
  selectedUmbrella.geometry.canopyRise = Number(canopyRiseInput.value);
  selectedUmbrella.geometry.shaftLength = Number(shaftLengthInput.value);
  selectedUmbrella.material.transmission = Number(transmissionInput.value);
  selectedUmbrella.material.roughness = Number(roughnessInput.value);
  selectedUmbrella.material.canopyColor = canopyColorInput.value;
  selectedUmbrella.material.ribColor = ribColorInput.value;
}

function scheduleUmbrellaRebuild(updateFraming = false) {
  copyControlsToSelectedUmbrella();
  updateParameterOutputs();

  if (rebuildRequest !== null) cancelAnimationFrame(rebuildRequest);
  rebuildRequest = requestAnimationFrame(() => {
    rebuildRequest = null;
    buildUmbrella(displayedOpenAmount, updateFraming);
  });
}

function updateCanopyColor() {
  canopyTintOverride = true;
  if (!selectedUmbrella || !umbrellaModel) return;

  selectedUmbrella.material.canopyColor = canopyColorInput.value;
  canopyColorValue.textContent = canopyColorInput.value.toUpperCase();
  const canopy = umbrellaModel.getObjectByName("canopy");
  canopy?.material.color.set(canopyColorInput.value);
}

function updateTransmission() {
  if (!selectedUmbrella || !umbrellaModel) return;

  const value = Number(transmissionInput.value);
  selectedUmbrella.material.transmission = value;
  transmissionValue.textContent = value.toFixed(2);
  const canopy = umbrellaModel.getObjectByName("canopy");
  if (canopy) {
    canopy.material.transmission = value;
    canopy.material.needsUpdate = true;
  }
}

function updateRoughness() {
  if (!selectedUmbrella || !umbrellaModel) return;

  const value = Number(roughnessInput.value);
  selectedUmbrella.material.roughness = value;
  roughnessValue.textContent = value.toFixed(2);
  const canopy = umbrellaModel.getObjectByName("canopy");
  if (canopy) canopy.material.roughness = value;
}

function updateRibColor() {
  if (!selectedUmbrella || !umbrellaModel) return;

  selectedUmbrella.material.ribColor = ribColorInput.value;
  ribColorValue.textContent = ribColorInput.value.toUpperCase();
  ["ribs", "struts"].forEach((name) => {
    umbrellaModel.getObjectByName(name)?.traverse((part) => {
      if (part instanceof THREE.Mesh) part.material.color.set(ribColorInput.value);
    });
  });
}

function previewBasicParameters() {
  updateParameterOutputs();
}

function updateGeometryFromControls() {
  if (!selectedUmbrella || !umbrellaModel) return;

  const ribLength = Number(ribLengthInput.value);

  selectedUmbrella.geometry.ribLength = ribLength;
  selectedUmbrella.geometry.canopyRise = Number(canopyRiseInput.value);
  selectedUmbrella.geometry.shaftLength = Number(shaftLengthInput.value);
  updateParameterOutputs();

  // 和开合控制相同：一帧只应用最新位置，拖得再快也不会积压旧计算。
  if (geometryUpdateRequest !== null) return;
  geometryUpdateRequest = requestAnimationFrame(() => {
    geometryUpdateRequest = null;
    if (!umbrellaModel) return;
    const latestRibLength = Number(ribLengthInput.value);
    const canopyDrop = 0.5;
    const canopyRadius = Math.sqrt(
      Math.max(latestRibLength ** 2 - canopyDrop ** 2, 0.01),
    );
    umbrellaModel.userData.setGeometry({
      canopyRadius,
      canopyRise: Number(canopyRiseInput.value),
      shaftLength: Number(shaftLengthInput.value),
    });
    // 中棒变长或变短时始终让手柄底端留在展台地面上。
    umbrellaModel.position.y = -umbrellaModel.userData.shaftBottomY;
  });
}

function updateRibCountFromControl() {
  if (!selectedUmbrella) return;

  selectedUmbrella.geometry.ribCount = Math.round(Number(ribCountInput.value));
  previewBasicParameters();

  // 骨数会改变模型结构，只合并很短时间内的连续输入，避免重复重建。
  if (ribCountUpdateTimer !== null) return;
  ribCountUpdateTimer = setTimeout(() => {
    ribCountUpdateTimer = null;
    scheduleUmbrellaRebuild(false);
  }, 70);
}

function beginPatternAlignment() {
  catalogOpening = null;
  pendingCanopyTexture = canopyTextureInput.value || null;
  isPatternTransitionPending = true;
  patternClosing = null;
  patternAngleSearch = null;
  patternOpening = null;
  stage.controls.enabled = true;

  // 提前让浏览器读取图片，闭伞后换纹样时不会因为等待图片而停顿。
  if (pendingCanopyTexture) {
    const preloadImage = new Image();
    preloadImage.src = pendingCanopyTexture;
  }

  const currentRotation = rotationGroup.rotation;
  const fullTurn = Math.PI * 2;

  patternAlignment = {
    startTime: performance.now(),
    fromX: currentRotation.x,
    fromY: currentRotation.y,
    fromZ: currentRotation.z,
    // 回到距离当前位置最近的完整圈，避免为了归正而突然反向转很远。
    targetY: Math.round(currentRotation.y / fullTurn) * fullTurn,
  };
}

function cultureText(value) {
  if (typeof value === "string") return value;
  return value?.text || "";
}

function appendCultureAnnotation(container, value) {
  if (!value || typeof value === "string") return;

  const annotationText = [value.level, value._source].filter(Boolean).join(" · ");
  if (!annotationText) return;

  const annotation = document.createElement("p");
  annotation.className = "culture__annotation";
  annotation.textContent = annotationText;
  container.append(annotation);
}

function renderTextPanel(panel, values) {
  panel.replaceChildren();

  values.filter((value) => cultureText(value)).forEach((value) => {
    const entry = document.createElement("article");
    const paragraph = document.createElement("p");
    entry.className = "culture-entry";
    paragraph.className = "culture__text";
    paragraph.textContent = cultureText(value);
    entry.append(paragraph);
    appendCultureAnnotation(entry, value);
    panel.append(entry);
  });
}

function renderCraftPanel(craftSteps) {
  craftPanel.replaceChildren();

  const list = document.createElement("div");
  list.className = "craft-list";

  craftSteps.forEach((step) => {
    const article = document.createElement("article");
    const image = document.createElement("img");
    const text = document.createElement("div");
    const name = document.createElement("h2");
    const description = document.createElement("p");

    article.className = "craft-step";
    image.className = "craft-step__image";
    image.src = step.image;
    image.alt = step.name;
    image.loading = "lazy";
    name.className = "craft-step__name";
    name.textContent = step.name;
    description.className = "craft-step__desc";
    description.textContent = step.desc;

    text.append(name, description);
    appendCultureAnnotation(text, step);
    article.append(image, text);
    list.append(article);
  });

  craftPanel.append(list);
}

function renderCulture(umbrella) {
  const culture = umbrella.culture || {};
  const craftSteps = umbrella.craftSteps || [];

  renderTextPanel(shapePanel, [
    culture.shape || "",
    culture.size || "",
    culture.materials || "",
  ]);
  renderCraftPanel(craftSteps);
  renderTextPanel(patternPanel, [
    culture.patternTheme || "",
    culture.patternMeaning || "",
  ]);
}

function selectCultureTab(selectedTab) {
  cultureTabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    const panel = document.querySelector(`#${tab.dataset.panel}`);
    tab.setAttribute("aria-selected", String(isSelected));
    panel.hidden = !isSelected;
  });
}

function selectUmbrella(selectedButton, umbrella, options = {}) {
  if (collectionMode === "active") {
    beginCollectionSelection(umbrella);
    if (document.body.classList.contains("is-catalog-open")) closePanel("catalog");
    return;
  }

  const shouldAnimateOpening = options.forceOpening || Boolean(
    selectedUmbrella
    && umbrellaModel
    && selectedUmbrella.id !== umbrella.id,
  );

  if (!options.forceOpening && !shouldAnimateOpening && selectedUmbrella?.id === umbrella.id) return;

  const buttons = umbrellaList.querySelectorAll(".catalog__item");

  buttons.forEach((button) => {
    button.setAttribute("aria-current", String(button === selectedButton));
  });

  selectedUmbrella = umbrella;
  ribCountInput.value = umbrella.geometry.ribCount;
  ribLengthInput.value = umbrella.geometry.ribLength;
  canopyRiseInput.value = umbrella.geometry.canopyRise;
  openAmountInput.value = umbrella.geometry.openAmount;
  shaftLengthInput.value = umbrella.geometry.shaftLength;
  transmissionInput.value = umbrella.material.transmission;
  roughnessInput.value = umbrella.material.roughness;
  canopyColorInput.value = umbrella.material.canopyColor;
  canopyTextureInput.value = umbrella.material.canopyTexture || "";
  ribColorInput.value = umbrella.material.ribColor;
  mainLightAngleInput.value = umbrella.lighting?.mainLightAngle ?? 321;
  mainLightTiltInput.value = umbrella.lighting?.mainLightTilt ?? 45;
  mainLightIntensityInput.value = umbrella.lighting?.mainLightIntensity ?? 4.5;
  activeCanopyTexture = umbrella.material.canopyTexture || null;
  canopyTintOverride = false;
  updateParameterOutputs();
  pendingCanopyTexture = null;
  patternAlignment = null;
  patternClosing = null;
  patternAngleSearch = null;
  patternOpening = null;
  catalogOpening = null;
  isPatternTransitionPending = false;

  // 每把伞先按完全展开时的尺寸确定镜头，再从同一模型的闭合状态展开。
  // 因此动画结束时，构图与这把伞正常加载后的展示状态完全一致。
  const targetOpenAmount = Number(umbrella.geometry.openAmount);
  rotationGroup.rotation.set(0, 0, 0);
  buildUmbrella(targetOpenAmount, true);

  if (shouldAnimateOpening) {
    displayedOpenAmount = 0;
    umbrellaModel.userData.setOpenAmount(0);
    catalogOpening = {
      startTime: performance.now(),
      targetOpenAmount,
      revealFromCollection: Boolean(options.revealFromCollection),
      targetMainLightIntensity: stage.mainLight.intensity,
      targetFillLightIntensity: stage.fillLight.intensity,
      targetRimLightIntensity: stage.rimLight.intensity,
      targetMainLightPosition: stage.mainLight.position.clone(),
      closedMainLightPosition: stage.mainLight.target.position
        .clone()
        .add(new THREE.Vector3(-6.2, 6.8, 3.6)),
    };
    if (options.revealFromCollection) {
      // 保留最终展厅的同一张背景，只压成暗版；左侧展品光先唤醒闭伞。
      stage.mainLight.intensity = 0;
      stage.fillLight.intensity = 0;
      stage.rimLight.intensity = 0;
      stage.mainLight.position.copy(catalogOpening.closedMainLightPosition);
      syncWideMainLights();
      setStageBackgroundMood(0.25, 0.6);
      collectionRevealBlackout.style.opacity = "1";
    }
    stage.controls.enabled = false;
  } else {
    stage.controls.enabled = true;
  }

  renderCulture(umbrella);
  if (document.body.classList.contains("is-catalog-open")) {
    closePanel("catalog");
  }
}

function renderCatalog() {
  umbrellas.forEach((umbrella, index) => {
    const listItem = document.createElement("li");
    const button = document.createElement("button");

    button.className = "catalog__item";
    button.type = "button";
    button.textContent = umbrella.name;
    button.dataset.umbrellaId = umbrella.id;
    button.setAttribute("aria-current", String(index === 0));
    button.addEventListener("click", () => selectUmbrella(button, umbrella));

    listItem.append(button);
    umbrellaList.append(listItem);

    if (index === 0) {
      selectUmbrella(button, umbrella);
    }
  });
}

function renderPatternOptions() {
  canopyTextureInput.replaceChildren();

  patternCatalog.forEach((pattern) => {
    const option = document.createElement("option");
    option.value = pattern.path;
    option.textContent = pattern.label;
    canopyTextureInput.append(option);
  });
}

async function loadUmbrellas() {
  setLoadingProgress(30, "正在读取伞目录…");
  try {
    const response = await fetch("./data/umbrellas.json?v=20260824-two-umbrellas");

    if (!response.ok) {
      throw new Error(`数据读取失败：${response.status}`);
    }

    const data = await response.json();
    patternCatalog = data.patterns;
    umbrellas = data.umbrellas;
    renderPatternOptions();
    setLoadingProgress(86, "正在陈设伞面…");
    renderCatalog();
    setLoadingProgress(100, "即将开馆…");
    dismissLoadingScreen();
  } catch (error) {
    catalogStatus.hidden = false;
    catalogStatus.textContent = "目录读取失败，请通过本地服务器打开页面。";
    console.error(error);
    setLoadingProgress(100, "目录读取失败");
    dismissLoadingScreen();
  }
}

openAmountInput.addEventListener("input", updateOpenAmountFromControl);
canopyTextureInput.addEventListener("change", beginPatternAlignment);
ribCountInput.addEventListener("input", updateRibCountFromControl);
ribLengthInput.addEventListener("input", updateGeometryFromControls);
canopyRiseInput.addEventListener("input", updateGeometryFromControls);
shaftLengthInput.addEventListener("input", updateGeometryFromControls);
transmissionInput.addEventListener("input", updateTransmission);
roughnessInput.addEventListener("input", updateRoughness);
canopyColorInput.addEventListener("input", updateCanopyColor);
ribColorInput.addEventListener("input", updateRibColor);
mainLightAngleInput.addEventListener("input", updateMainLightFromControls);
mainLightTiltInput.addEventListener("input", updateMainLightFromControls);
mainLightSpreadInput.addEventListener("input", updateMainLightFromControls);
mainLightIntensityInput.addEventListener("input", updateMainLightFromControls);
cultureTabs.forEach((tab) => {
  tab.addEventListener("click", () => selectCultureTab(tab));
});

let previousTime = performance.now();

function rotateUmbrella(currentTime) {
  const elapsedSeconds = Math.min((currentTime - previousTime) / 1000, 0.1);
  previousTime = currentTime;

  if (awakeningPhase !== "idle") {
    updateAwakeningAnimation(currentTime);
  } else if (collectionMode !== "inactive") {
    updateCollectionHall(currentTime, elapsedSeconds);
  } else if (collectionReturnMotion) {
    updateReturnToCollectionHall(currentTime);
  } else if (patternAlignment) {
    const progress = Math.min(
      (currentTime - patternAlignment.startTime) / PATTERN_ALIGNMENT_DURATION,
      1,
    );
    const easedProgress = progress < 0.5
      ? 4 * progress ** 3
      : 1 - ((-2 * progress + 2) ** 3) / 2;

    rotationGroup.rotation.x = THREE.MathUtils.lerp(
      patternAlignment.fromX,
      0,
      easedProgress,
    );
    rotationGroup.rotation.y = THREE.MathUtils.lerp(
      patternAlignment.fromY,
      patternAlignment.targetY,
      easedProgress,
    );
    rotationGroup.rotation.z = THREE.MathUtils.lerp(
      patternAlignment.fromZ,
      0,
      easedProgress,
    );

    if (progress === 1) {
      patternAlignment = null;
      patternClosing = {
        startTime: currentTime,
        fromOpenAmount: displayedOpenAmount,
      };
    }
  } else if (patternClosing) {
    const progress = Math.min(
      (currentTime - patternClosing.startTime) / PATTERN_CLOSING_DURATION,
      1,
    );
    // 平滑步进让竹骨起步从容、中段连贯，并在闭合处干净停住。
    const easedProgress = progress * progress * (3 - 2 * progress);
    const nextOpenAmount = THREE.MathUtils.lerp(
      patternClosing.fromOpenAmount,
      0,
      easedProgress,
    );

    displayedOpenAmount = nextOpenAmount;
    umbrellaModel.userData.setOpenAmount(nextOpenAmount);

    if (progress === 1) {
      patternClosing = null;
      // 闭合状态下换入新纹样，随后展开时图案会随纸面逐渐显现。
      activeCanopyTexture = pendingCanopyTexture;
      buildUmbrella(0, false);

      const cameraTarget = stage.controls.target.clone();
      const cameraDestination = stage.camera.position
        .clone()
        .sub(cameraTarget)
        .applyAxisAngle(WORLD_UP, THREE.MathUtils.degToRad(6))
        .add(cameraTarget);
      const lightTarget = stage.mainLight.target.position.clone();
      const lightDestination = stage.mainLight.position
        .clone()
        .sub(lightTarget)
        .applyAxisAngle(WORLD_UP, THREE.MathUtils.degToRad(-22))
        .add(lightTarget);

      patternAngleSearch = {
        startTime: currentTime,
        fromRotationY: rotationGroup.rotation.y,
        targetRotationY: rotationGroup.rotation.y + THREE.MathUtils.degToRad(38),
        fromCameraPosition: stage.camera.position.clone(),
        targetCameraPosition: cameraDestination,
        fromLightPosition: stage.mainLight.position.clone(),
        targetLightPosition: lightDestination,
      };
      stage.controls.enabled = false;
    }
  } else if (patternAngleSearch) {
    const progress = Math.min(
      (currentTime - patternAngleSearch.startTime) / PATTERN_ANGLE_SEARCH_DURATION,
      1,
    );
    const easedProgress = (1 - Math.cos(Math.PI * progress)) / 2;

    rotationGroup.rotation.y = THREE.MathUtils.lerp(
      patternAngleSearch.fromRotationY,
      patternAngleSearch.targetRotationY,
      easedProgress,
    );
    stage.camera.position.lerpVectors(
      patternAngleSearch.fromCameraPosition,
      patternAngleSearch.targetCameraPosition,
      easedProgress,
    );
    stage.mainLight.position.lerpVectors(
      patternAngleSearch.fromLightPosition,
      patternAngleSearch.targetLightPosition,
      easedProgress,
    );
    syncWideMainLights();

    if (progress === 1) {
      patternAngleSearch = null;
      const presentation = getPatternPresentation(pendingCanopyTexture);
      const cameraTarget = stage.controls.target.clone();
      const cameraDestination = stage.camera.position
        .clone()
        .sub(cameraTarget)
        .multiplyScalar(1.06)
        .applyAxisAngle(
          WORLD_UP,
          THREE.MathUtils.degToRad(presentation.cameraOrbitAngle),
        )
        .add(cameraTarget);
      cameraDestination.y += presentation.cameraHeightOffset;

      patternOpening = {
        startTime: currentTime,
        targetOpenAmount: Number(openAmountInput.value),
        fromCameraPosition: stage.camera.position.clone(),
        targetCameraPosition: cameraDestination,
        fromLightIntensity: stage.mainLight.intensity,
        targetLightIntensity:
          Number(mainLightIntensityInput.value)
          * presentation.lightIntensityMultiplier,
      };
      stage.mainLight.shadow.radius = presentation.shadowRadius;
    }
  } else if (patternOpening) {
    const progress = Math.min(
      (currentTime - patternOpening.startTime) / PATTERN_OPENING_DURATION,
      1,
    );
    // 慢起、强劲中段、干净收尾，让展开形成高潮但不产生机械弹跳。
    const easedProgress = progress ** 3
      * (progress * (progress * 6 - 15) + 10);
    const nextOpenAmount = THREE.MathUtils.lerp(
      0,
      patternOpening.targetOpenAmount,
      easedProgress,
    );

    displayedOpenAmount = nextOpenAmount;
    umbrellaModel.userData.setOpenAmount(nextOpenAmount);
    stage.camera.position.lerpVectors(
      patternOpening.fromCameraPosition,
      patternOpening.targetCameraPosition,
      easedProgress,
    );
    stage.mainLight.intensity = THREE.MathUtils.lerp(
      patternOpening.fromLightIntensity,
      patternOpening.targetLightIntensity,
      easedProgress,
    );
    syncWideMainLights();

    if (progress === 1) {
      patternOpening = null;
      pendingCanopyTexture = null;
      isPatternTransitionPending = false;
      stage.controls.enabled = true;
    }
  } else if (catalogOpening) {
    const isCollectionReveal = catalogOpening.revealFromCollection;
    const closedRevealDuration = prefersReducedMotion
      ? 80
      : COLLECTION_CLOSED_REVEAL_DURATION;
    const closedHoldDuration = prefersReducedMotion
      ? 40
      : COLLECTION_CLOSED_HOLD_DURATION;
    const openingDuration = isCollectionReveal
      ? (prefersReducedMotion ? 180 : COLLECTION_OPENING_DURATION)
      : CATALOG_OPENING_DURATION;
    const elapsed = currentTime - catalogOpening.startTime;
    const openingStart = isCollectionReveal
      ? closedRevealDuration + closedHoldDuration
      : 0;
    const progress = Math.min(
      Math.max((elapsed - openingStart) / openingDuration, 0),
      1,
    );

    if (isCollectionReveal && elapsed < openingStart) {
      const lightProgress = Math.min(elapsed / closedRevealDuration, 1);
      const easedLight = smootherStep(lightProgress);
      // 黑幕先退到半明，让用户只看见完全闭合的伞和一束展品光。
      collectionRevealBlackout.style.opacity = String(
        THREE.MathUtils.lerp(1, 0.05, easedLight),
      );
      stage.mainLight.intensity = THREE.MathUtils.lerp(
        0,
        catalogOpening.targetMainLightIntensity * 0.95,
        easedLight,
      );
      stage.mainLight.position.copy(catalogOpening.closedMainLightPosition);
      stage.fillLight.intensity = THREE.MathUtils.lerp(
        0,
        catalogOpening.targetFillLightIntensity * 0.22,
        easedLight,
      );
      stage.rimLight.intensity = THREE.MathUtils.lerp(
        0,
        catalogOpening.targetRimLightIntensity,
        easedLight,
      );
      syncWideMainLights();
    }

    // 五次平滑曲线让开伞在起步和收尾处速度、加速度都自然归零。
    const easedProgress = progress ** 3
      * (progress * (progress * 6 - 15) + 10);
    const nextOpenAmount = THREE.MathUtils.lerp(
      0,
      catalogOpening.targetOpenAmount,
      easedProgress,
    );

    displayedOpenAmount = nextOpenAmount;
    umbrellaModel.userData.setOpenAmount(nextOpenAmount);

    if (isCollectionReveal && elapsed >= openingStart) {
      // 伞面张开的同时，黑幕、背景和完整展厅光线同步显现。
      collectionRevealBlackout.style.opacity = String(
        THREE.MathUtils.lerp(0.05, 0, easedProgress),
      );
      setStageBackgroundMood(
        THREE.MathUtils.lerp(0.25, 0.3, easedProgress),
        THREE.MathUtils.lerp(0.6, 0.65, easedProgress),
      );
      stage.mainLight.position.lerpVectors(
        catalogOpening.closedMainLightPosition,
        catalogOpening.targetMainLightPosition,
        easedProgress,
      );
      stage.mainLight.intensity = THREE.MathUtils.lerp(
        catalogOpening.targetMainLightIntensity * 0.95,
        catalogOpening.targetMainLightIntensity,
        easedProgress,
      );
      stage.fillLight.intensity = THREE.MathUtils.lerp(
        catalogOpening.targetFillLightIntensity * 0.22,
        catalogOpening.targetFillLightIntensity,
        easedProgress,
      );
      stage.rimLight.intensity = THREE.MathUtils.lerp(
        catalogOpening.targetRimLightIntensity,
        catalogOpening.targetRimLightIntensity,
        easedProgress,
      );
      syncWideMainLights();
    }

    if (progress === 1) {
      displayedOpenAmount = catalogOpening.targetOpenAmount;
      umbrellaModel.userData.setOpenAmount(displayedOpenAmount);
      if (isCollectionReveal) {
        collectionRevealBlackout.style.opacity = "";
        collectionRevealBlackout.style.transition = "";
        restoreStageBackgroundMood();
        collectionHallUi.hidden = true;
        collectionHallUi.className = "collection-hall-ui";
        document.body.classList.remove("is-collection-intro");
        wakeInterface();
        // 揭幕结束后再逐帧准备八伞藏馆，避免和开伞动画争抢性能。
        window.setTimeout(startCollectionHallPrebuild, 1200);
      }
      catalogOpening = null;
      stage.controls.enabled = true;
    }
  } else if (!isPatternTransitionPending && !prefersReducedMotion) {
    rotationGroup.rotation.y += elapsedSeconds * 0.12;
  }

  requestAnimationFrame(rotateUmbrella);
}

setLoadingProgress(12, "正在准备展馆…");
requestAnimationFrame(rotateUmbrella);
loadUmbrellas();
