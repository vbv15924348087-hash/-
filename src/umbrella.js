import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();
const canopyTextureCache = new Map();
const bambooRibTexture = textureLoader.load(
  new URL("../assets/textures/bamboo-rib.png", import.meta.url).href,
);
const woodHandleTexture = textureLoader.load(
  new URL("../assets/textures/wood-handle.png", import.meta.url).href,
);

bambooRibTexture.colorSpace = THREE.SRGBColorSpace;
bambooRibTexture.wrapS = THREE.RepeatWrapping;
bambooRibTexture.wrapT = THREE.RepeatWrapping;

woodHandleTexture.colorSpace = THREE.SRGBColorSpace;
woodHandleTexture.wrapS = THREE.RepeatWrapping;
woodHandleTexture.wrapT = THREE.RepeatWrapping;
woodHandleTexture.center.set(0.5, 0.5);
woodHandleTexture.rotation = Math.PI / 2;

/**
 * 创建一把参数化的油纸伞。
 *
 * 当前阶段先完成完全张开时的结构；openAmount 默认值为 1。
 * @param {Object} params 伞的尺寸、数量和颜色参数
 * @returns {THREE.Group} 包含伞面、伞骨、撑骨、中棒、上下巢和手柄的组合对象
 */
export function createUmbrella(params = {}) {
  const {
    ribCount = 24,
    openAmount = 1,
    canopyRadius = 1.6,
    canopyDrop = 0.5,
    canopyRise = 0.14,
    canopyRings = 10,
    closedRadiusRatio = 0.12,
    openHubOffset = 0.78,
    shaftLength = 3.2,
    shaftRadius = 0.025,
    // 保留真实骨数，同时用较纤细的截面避免仰视时形成沉重的黑色网格。
    ribRadius = 0.011,
    strutRadius = 0.0085,
    hubHeight = 0.14,
    handleLength = 0.52,
    handleRadius = 0.055,
    canopyTexture = null,
    canopyColor = 0xb7392f,
    transmission = 0.45,
    roughness = 0.55,
    bambooColor = 0x65714a,
    ribColor = 0xffffff,
    woodColor = 0xffffff,
    hubColor = 0x8a6a3f,
  } = params;

  const safeRibCount = Math.max(6, Math.round(ribCount));
  // 使用偶数圈，确保撑骨总能准确连接到伞骨的几何中点。
  const safeCanopyRings = Math.max(4, Math.round(canopyRings / 2) * 2);
  const openness = THREE.MathUtils.clamp(openAmount, 0, 1);
  const openProgress = openness * openness * (3 - 2 * openness);
  let activeCanopyRadius = canopyRadius;
  let activeCanopyRise = canopyRise;
  let activeShaftLength = shaftLength;

  const umbrella = new THREE.Group();
  umbrella.name = "umbrella";

  const canopyTopY = 1.25;
  let shaftBottomY = canopyTopY - activeShaftLength;

  // 伞骨保持同样的有效长度。收拢时水平半径变小，伞缘自然向下落。
  let ribReach = Math.hypot(activeCanopyRadius, canopyDrop);
  let closedRadius = activeCanopyRadius
    * THREE.MathUtils.clamp(closedRadiusRatio, 0.05, 0.4);
  const currentRadius = THREE.MathUtils.lerp(
    closedRadius,
    activeCanopyRadius,
    openProgress,
  );
  const currentDrop = Math.sqrt(
    Math.max(ribReach * ribReach - currentRadius * currentRadius, 0),
  );
  const currentRise = activeCanopyRise * openProgress;
  const canopyEdgeY = canopyTopY - currentDrop;

  // 撑骨长度固定。根据它与伞骨中点组成的三角形，反推下巢高度。
  let fullMidpointY = canopyTopY
    - canopyDrop * 0.5
    - activeCanopyRise
    - ribRadius;
  const fullLowerHubY = canopyTopY - openHubOffset;
  let strutLength = Math.hypot(
    activeCanopyRadius * 0.5,
    fullMidpointY - fullLowerHubY,
  );
  const currentMidpointRadius = currentRadius * 0.5;
  const currentMidpointY = canopyTopY - currentDrop * 0.5 - currentRise - ribRadius;
  const lowerHubY = currentMidpointY - Math.sqrt(
    Math.max(
      strutLength * strutLength - currentMidpointRadius * currentMidpointRadius,
      0,
    ),
  );

  let canopyMap = null;
  if (canopyTexture) {
    const textureUrl = new URL(canopyTexture, document.baseURI).href;
    canopyMap = canopyTextureCache.get(textureUrl);

    if (!canopyMap) {
      canopyMap = textureLoader.load(textureUrl);
      canopyMap.colorSpace = THREE.SRGBColorSpace;
      canopyMap.wrapS = THREE.ClampToEdgeWrapping;
      canopyMap.wrapT = THREE.ClampToEdgeWrapping;
      canopyTextureCache.set(textureUrl, canopyMap);
    }
  }

  const canopyMaterial = new THREE.MeshPhysicalMaterial({
    color: canopyMap ? 0xffffff : canopyColor,
    map: canopyMap,
    transmission: THREE.MathUtils.clamp(transmission, 0, 1),
    roughness: THREE.MathUtils.clamp(roughness, 0, 1),
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const bambooMaterial = new THREE.MeshStandardMaterial({
    color: bambooColor,
    roughness: 0.72,
    metalness: 0,
  });
  const ribMaterial = new THREE.MeshStandardMaterial({
    color: ribColor,
    map: bambooRibTexture,
    roughness: 0.7,
    metalness: 0,
  });
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: woodColor,
    map: woodHandleTexture,
    roughness: 0.8,
    metalness: 0,
  });
  const hubMaterial = new THREE.MeshStandardMaterial({
    color: hubColor,
    roughness: 0.62,
    metalness: 0,
  });

  // 细杆默认沿 Y 轴生成，再旋转到起点和终点之间。
  const addRod = (parent, start, end, radius, material, name) => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 8),
      material,
    );

    rod.name = name;
    rod.userData.baseLength = length;
    rod.position.copy(start).add(end).multiplyScalar(0.5);
    rod.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    parent.add(rod);
    return rod;
  };

  const rodDirection = new THREE.Vector3();
  const rodUp = new THREE.Vector3(0, 1, 0);

  const updateRod = (rod, start, end) => {
    rodDirection.subVectors(end, start);
    const length = rodDirection.length();

    rod.position.copy(start).add(end).multiplyScalar(0.5);
    rod.quaternion.setFromUnitVectors(
      rodUp,
      rodDirection.normalize(),
    );
    rod.scale.y = length / rod.userData.baseLength;
  };

  // 中棒从伞顶贯穿到手柄底部。
  const shaftTopY = canopyTopY + 0.08;
  const initialShaftSpan = shaftTopY - shaftBottomY;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftTopY - shaftBottomY, 12),
    bambooMaterial,
  );
  shaft.name = "shaft";
  shaft.position.y = (shaftTopY + shaftBottomY) / 2;
  umbrella.add(shaft);

  // 上巢固定；开伞时，等长撑骨会带动下巢沿中棒向上滑动。
  const upperHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.085, hubHeight, 16),
    hubMaterial,
  );
  upperHub.name = "upper-hub";
  upperHub.position.y = canopyTopY - hubHeight / 2;
  umbrella.add(upperHub);

  const lowerHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.055, hubHeight, 16),
    hubMaterial,
  );
  lowerHub.name = "lower-hub";
  lowerHub.position.y = lowerHubY;
  umbrella.add(lowerHub);

  // 伞面和伞骨共用同一条轮廓，因此开合时不会彼此穿插。
  const canopyVertices = [0, canopyTopY, 0];
  const canopyUvs = [0.5, 0.5];
  const canopyIndices = [];

  for (let ring = 1; ring <= safeCanopyRings; ring += 1) {
    const t = ring / safeCanopyRings;
    const radius = currentRadius * t;
    const y = canopyTopY - currentDrop * t - currentRise * Math.sin(Math.PI * t);

    for (let rib = 0; rib < safeRibCount; rib += 1) {
      const angle = (rib / safeRibCount) * Math.PI * 2;
      canopyVertices.push(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius,
      );

      // 水平半径决定纹样半径，方位角决定纹样角度。
      // t=0 对应图片圆心，t=1 对应图片外圆边缘。
      canopyUvs.push(
        0.5 + Math.cos(angle) * t * 0.5,
        0.5 + Math.sin(angle) * t * 0.5,
      );
    }
  }

  for (let rib = 0; rib < safeRibCount; rib += 1) {
    const nextRib = (rib + 1) % safeRibCount;
    canopyIndices.push(0, 1 + rib, 1 + nextRib);
  }

  for (let ring = 1; ring < safeCanopyRings; ring += 1) {
    const innerStart = 1 + (ring - 1) * safeRibCount;
    const outerStart = 1 + ring * safeRibCount;

    for (let rib = 0; rib < safeRibCount; rib += 1) {
      const nextRib = (rib + 1) % safeRibCount;
      const inner = innerStart + rib;
      const innerNext = innerStart + nextRib;
      const outer = outerStart + rib;
      const outerNext = outerStart + nextRib;
      canopyIndices.push(inner, outer, outerNext, inner, outerNext, innerNext);
    }
  }

  const canopyGeometry = new THREE.BufferGeometry();
  canopyGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(canopyVertices, 3),
  );
  canopyGeometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(canopyUvs, 2),
  );
  canopyGeometry.setIndex(canopyIndices);
  canopyGeometry.computeVertexNormals();

  const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
  canopy.name = "canopy";
  umbrella.add(canopy);

  // 每根伞骨沿着伞面的弧线延伸，撑骨连接下巢和伞骨中点。
  const ribs = new THREE.Group();
  ribs.name = "ribs";
  const struts = new THREE.Group();
  struts.name = "struts";
  const ribRodRows = [];
  const strutRods = [];
  const animatedRibPoints = Array.from(
    { length: safeRibCount },
    () => Array.from(
      { length: safeCanopyRings + 1 },
      () => new THREE.Vector3(),
    ),
  );
  const animatedStrutStart = new THREE.Vector3();

  for (let rib = 0; rib < safeRibCount; rib += 1) {
    const angle = (rib / safeRibCount) * Math.PI * 2;
    const ribPoints = [];
    const ribRods = [];

    for (let ring = 0; ring <= safeCanopyRings; ring += 1) {
      const t = ring / safeCanopyRings;
      const radius = currentRadius * t;
      const y = canopyTopY - currentDrop * t - currentRise * Math.sin(Math.PI * t);
      ribPoints.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          y - ribRadius,
          Math.sin(angle) * radius,
        ),
      );
    }

    for (let segment = 0; segment < ribPoints.length - 1; segment += 1) {
      ribRods.push(
        addRod(
          ribs,
          ribPoints[segment],
          ribPoints[segment + 1],
          ribRadius,
          ribMaterial,
          `rib-${rib + 1}`,
        ),
      );
    }
    ribRodRows.push(ribRods);

    const middlePoint = ribPoints[Math.round(safeCanopyRings / 2)];
    const strutStart = new THREE.Vector3(0, lowerHubY, 0);
    strutRods.push(
      addRod(
        struts,
        strutStart,
        middlePoint,
        strutRadius,
        ribMaterial,
        `strut-${rib + 1}`,
      ),
    );
  }

  umbrella.add(ribs, struts);

  // 手柄先用简洁的直柄表示，包住中棒底端。
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(
      handleRadius * 0.88,
      handleRadius,
      handleLength,
      16,
    ),
    woodMaterial,
  );
  handle.name = "handle";
  handle.position.y = shaftBottomY + handleLength / 2;
  umbrella.add(handle);

  umbrella.userData.openAmount = openness;
  umbrella.userData.canopyRadius = currentRadius;
  umbrella.userData.canopyEdgeY = canopyEdgeY;
  umbrella.userData.lowerHubY = lowerHubY;
  umbrella.userData.strutLength = strutLength;
  umbrella.userData.shaftBottomY = shaftBottomY;

  // 动画时只更新现有顶点与杆件变换，避免逐帧销毁、重建整把伞造成顿挫。
  umbrella.userData.setOpenAmount = (nextOpenAmount) => {
    const nextOpenness = THREE.MathUtils.clamp(nextOpenAmount, 0, 1);
    const nextProgress = nextOpenness * nextOpenness * (3 - 2 * nextOpenness);
    const nextRadius = THREE.MathUtils.lerp(
      closedRadius,
      activeCanopyRadius,
      nextProgress,
    );
    const nextDrop = Math.sqrt(
      Math.max(ribReach * ribReach - nextRadius * nextRadius, 0),
    );
    const nextRise = activeCanopyRise * nextProgress;
    const nextMidpointRadius = nextRadius * 0.5;
    const nextMidpointY = canopyTopY
      - nextDrop * 0.5
      - nextRise
      - ribRadius;
    const nextLowerHubY = nextMidpointY - Math.sqrt(
      Math.max(
        strutLength * strutLength - nextMidpointRadius * nextMidpointRadius,
        0,
      ),
    );

    const positionAttribute = canopyGeometry.getAttribute("position");
    lowerHub.position.y = nextLowerHubY;

    for (let ring = 1; ring <= safeCanopyRings; ring += 1) {
      const t = ring / safeCanopyRings;
      const radius = nextRadius * t;
      const y = canopyTopY - nextDrop * t - nextRise * Math.sin(Math.PI * t);

      for (let rib = 0; rib < safeRibCount; rib += 1) {
        const angle = (rib / safeRibCount) * Math.PI * 2;
        const vertexIndex = 1 + (ring - 1) * safeRibCount + rib;
        positionAttribute.setXYZ(
          vertexIndex,
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius,
        );
      }
    }

    positionAttribute.needsUpdate = true;
    canopyGeometry.computeVertexNormals();

    for (let rib = 0; rib < safeRibCount; rib += 1) {
      const angle = (rib / safeRibCount) * Math.PI * 2;
      const ribPoints = animatedRibPoints[rib];

      for (let ring = 0; ring <= safeCanopyRings; ring += 1) {
        const t = ring / safeCanopyRings;
        const radius = nextRadius * t;
        const y = canopyTopY - nextDrop * t - nextRise * Math.sin(Math.PI * t);
        ribPoints[ring].set(
          Math.cos(angle) * radius,
          y - ribRadius,
          Math.sin(angle) * radius,
        );
      }

      ribRodRows[rib].forEach((rod, segment) => {
        updateRod(rod, ribPoints[segment], ribPoints[segment + 1]);
      });

      updateRod(
        strutRods[rib],
        animatedStrutStart.set(0, nextLowerHubY, 0),
        ribPoints[Math.round(safeCanopyRings / 2)],
      );
    }

    umbrella.userData.openAmount = nextOpenness;
    umbrella.userData.canopyRadius = nextRadius;
    umbrella.userData.canopyEdgeY = canopyTopY - nextDrop;
    umbrella.userData.lowerHubY = nextLowerHubY;
  };

  // 调参台拖动尺寸时，直接更新现有顶点和杆件，不销毁、重建整把伞。
  umbrella.userData.setGeometry = (nextGeometry = {}) => {
    if (Number.isFinite(nextGeometry.canopyRadius)) {
      activeCanopyRadius = Math.max(0.2, nextGeometry.canopyRadius);
    }
    if (Number.isFinite(nextGeometry.canopyRise)) {
      activeCanopyRise = Math.max(0, nextGeometry.canopyRise);
    }
    if (Number.isFinite(nextGeometry.shaftLength)) {
      activeShaftLength = Math.max(handleLength, nextGeometry.shaftLength);
    }

    ribReach = Math.hypot(activeCanopyRadius, canopyDrop);
    closedRadius = activeCanopyRadius
      * THREE.MathUtils.clamp(closedRadiusRatio, 0.05, 0.4);
    fullMidpointY = canopyTopY
      - canopyDrop * 0.5
      - activeCanopyRise
      - ribRadius;
    strutLength = Math.hypot(
      activeCanopyRadius * 0.5,
      fullMidpointY - fullLowerHubY,
    );

    shaftBottomY = canopyTopY - activeShaftLength;
    const nextShaftSpan = shaftTopY - shaftBottomY;
    shaft.scale.y = nextShaftSpan / initialShaftSpan;
    shaft.position.y = (shaftTopY + shaftBottomY) / 2;
    handle.position.y = shaftBottomY + handleLength / 2;

    umbrella.userData.strutLength = strutLength;
    umbrella.userData.shaftBottomY = shaftBottomY;
    umbrella.userData.setOpenAmount(umbrella.userData.openAmount);
  };

  return umbrella;
}
