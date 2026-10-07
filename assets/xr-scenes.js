import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { initPlayground } from './xr-wonderland.js?v=1';


const colors = {
  cyan: 0x18e4ff,
  pink: 0xff3df2,
  lime: 0xb8ff5e,
  amber: 0xffb84d,
  yellow: 0xfefe33,
  blue: 0x45a7ff,
  red: 0xff4c61,
  ink: 0xf4f7fb,
  violet: 0x8b5cff,
  dark: 0x070712
};

const neonMat = (color, opacity = 1) => new THREE.MeshStandardMaterial({
  color,
  emissive: color,
  emissiveIntensity: 0.35,
  flatShading: true,
  roughness: 0.62,
  metalness: 0.05,
  transparent: opacity < 1,
  opacity
});

const lineMat = (color, opacity = 0.72) => new THREE.LineBasicMaterial({
  color,
  transparent: true,
  opacity
});

function addMesh(parent, geometry, material, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function makeCylinderBetween(a, b, radius, material, segments = 8) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const length = start.distanceTo(end);
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
  cylinder.position.copy(midpoint);
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  return cylinder;
}

function addGrid(parent, size = 14, divisions = 28) {
  const grid = new THREE.GridHelper(size, divisions, colors.cyan, colors.violet);
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  parent.add(grid);
  return grid;
}

function makeCollisionTheme() {
  const group = new THREE.Group();
  const ellipsoidMat = neonMat(colors.cyan, 0.42);
  const wireMat = new THREE.MeshBasicMaterial({ color: colors.cyan, wireframe: true, transparent: true, opacity: 0.72 });
  const g = new THREE.IcosahedronGeometry(0.72, 2);
  addMesh(group, g, ellipsoidMat, [-0.34, 0.72, 0], [1.28, 0.72, 0.86], [0.12, 0.18, -0.2]);
  addMesh(group, g, ellipsoidMat, [0.46, 0.78, 0.04], [1.06, 0.62, 0.92], [-0.12, -0.28, 0.22]);
  addMesh(group, g, wireMat, [-0.34, 0.72, 0], [1.31, 0.75, 0.89], [0.12, 0.18, -0.2]);
  addMesh(group, g, wireMat, [0.46, 0.78, 0.04], [1.09, 0.65, 0.95], [-0.12, -0.28, 0.22]);
  return group;
}

function makeRunnerTheme() {
  const group = new THREE.Group();
  const body = neonMat(colors.lime);
  const limb = neonMat(colors.ink);
  addMesh(group, new THREE.IcosahedronGeometry(0.22, 1), body, [0, 1.75, 0]);
  group.add(makeCylinderBetween([0, 1.5, 0], [0.05, 0.84, 0], 0.1, body));
  group.add(makeCylinderBetween([0.03, 1.25, 0], [-0.48, 0.96, 0.22], 0.055, limb));
  group.add(makeCylinderBetween([0.03, 1.22, 0], [0.5, 1.42, -0.18], 0.055, limb));
  group.add(makeCylinderBetween([0.04, 0.86, 0], [-0.48, 0.32, 0.18], 0.07, body));
  group.add(makeCylinderBetween([-0.48, 0.32, 0.18], [-0.78, 0.08, 0.36], 0.06, body));
  group.add(makeCylinderBetween([0.04, 0.86, 0], [0.48, 0.43, -0.18], 0.07, body));
  group.add(makeCylinderBetween([0.48, 0.43, -0.18], [0.76, 0.86, -0.42], 0.06, body));
  return group;
}

function makeRamenTheme() {
  const group = new THREE.Group();
  addMesh(group, new THREE.SphereGeometry(0.72, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), neonMat(colors.blue), [0, 0.46, 0], [1.3, 0.62, 1.3], [Math.PI, 0, 0]);
  addMesh(group, new THREE.TorusGeometry(0.78, 0.06, 8, 28), neonMat(colors.cyan), [0, 0.64, 0], [1, 1, 0.42], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.TorusGeometry(0.3, 0.025, 6, 18), neonMat(colors.yellow), [-0.2, 0.82, 0.05], [1, 0.6, 1], [Math.PI / 2, 0.2, 0.4]);
  addMesh(group, new THREE.TorusGeometry(0.26, 0.025, 6, 18), neonMat(colors.yellow), [0.22, 0.82, 0.02], [1, 0.56, 1], [Math.PI / 2, -0.2, -0.3]);
  group.add(makeCylinderBetween([0.34, 1.12, -0.44], [1.06, 1.7, -0.06], 0.025, neonMat(colors.amber), 6));
  group.add(makeCylinderBetween([0.18, 1.14, -0.5], [0.9, 1.72, -0.12], 0.025, neonMat(colors.amber), 6));
  return group;
}

function makeCreationTheme() {
  const group = new THREE.Group();
  group.add(makeCylinderBetween([-0.8, 0.45, 0.1], [0.34, 1.58, -0.18], 0.06, neonMat(colors.pink), 8));
  addMesh(group, new THREE.ConeGeometry(0.12, 0.32, 8), neonMat(colors.ink), [0.44, 1.68, -0.2], [1, 1, 1], [0.8, 0, -0.76]);
  addMesh(group, new THREE.CylinderGeometry(0.68, 0.68, 0.08, 7), neonMat(colors.violet), [-0.15, 0.28, 0], [1.2, 0.55, 0.9], [0, 0, 0]);
  [[-0.42, 0.36, 0.1, colors.cyan], [-0.08, 0.38, 0.12, colors.yellow], [0.26, 0.37, 0.1, colors.red]].forEach(([x, y, z, color]) => {
    addMesh(group, new THREE.CylinderGeometry(0.1, 0.1, 0.035, 10), neonMat(color), [x, y, z], [1, 1, 1], [Math.PI / 2, 0, 0]);
  });
  return group;
}

function makeMedicalTheme() {
  const group = new THREE.Group();
  addMesh(group, new THREE.SphereGeometry(0.28, 10, 8), neonMat(colors.red), [-0.18, 1.18, 0], [1, 1, 0.78]);
  addMesh(group, new THREE.SphereGeometry(0.28, 10, 8), neonMat(colors.red), [0.18, 1.18, 0], [1, 1, 0.78]);
  addMesh(group, new THREE.ConeGeometry(0.42, 0.68, 4), neonMat(colors.red), [0, 0.86, 0], [1, 1, 0.74], [0, 0, Math.PI / 4]);
  addMesh(group, new THREE.SphereGeometry(0.34, 10, 8), neonMat(colors.ink), [0.82, 1.06, 0]);
  addMesh(group, new THREE.BoxGeometry(0.52, 0.26, 0.42), neonMat(colors.ink), [0.82, 0.68, 0]);
  addMesh(group, new THREE.SphereGeometry(0.07, 8, 6), neonMat(colors.dark), [0.7, 1.08, 0.29]);
  addMesh(group, new THREE.SphereGeometry(0.07, 8, 6), neonMat(colors.dark), [0.94, 1.08, 0.29]);
  return group;
}

function makePerson({ vr = false } = {}) {
  const group = new THREE.Group();
  const skin = neonMat(0xffc38b);
  const suit = neonMat(vr ? colors.pink : colors.blue);
  addMesh(group, new THREE.SphereGeometry(0.16, 10, 8), skin, [0, 1.22, 0]);
  addMesh(group, new THREE.BoxGeometry(0.32, 0.42, 0.18), suit, [0, 0.86, 0]);
  group.add(makeCylinderBetween([-0.12, 0.66, 0], [-0.32, 0.25, 0.16], 0.045, suit));
  group.add(makeCylinderBetween([0.12, 0.66, 0], [0.34, 0.25, -0.12], 0.045, suit));
  group.add(makeCylinderBetween([-0.14, 1.02, 0], [-0.42, 0.88, 0.18], 0.038, suit));
  group.add(makeCylinderBetween([0.14, 1.02, 0], vr ? [0.6, 1.24, 0.18] : [0.42, 0.88, 0.14], 0.038, suit));
  if (vr) {
    addMesh(group, new THREE.BoxGeometry(0.36, 0.12, 0.12), neonMat(colors.cyan), [0, 1.24, 0.13]);
  }
  return group;
}

function buildHeroScene(scene) {
  const root = new THREE.Group();
  scene.add(root);
  addGrid(root, 15, 30);
  addMesh(root, new THREE.ConeGeometry(0.42, 0.9, 5), neonMat(colors.yellow), [-3.6, 0.45, -1.4]);
  addMesh(root, new THREE.BoxGeometry(0.72, 0.72, 0.72, 2, 2, 2), neonMat(colors.blue), [-2.45, 0.42, 0.4], [1, 1, 1], [0.2, 0.42, 0.1]);
  addMesh(root, new THREE.IcosahedronGeometry(0.52, 2), neonMat(colors.red), [-1.18, 0.52, -0.72]);

  const themes = [
    [makeCollisionTheme(), [1.0, 0, -1.1], 0.8],
    [makeRunnerTheme(), [3.05, 0, -0.5], 0.78],
    [makeRamenTheme(), [-3.4, 0, 1.85], 0.74],
    [makeCreationTheme(), [-0.65, 0, 2.05], 0.84],
    [makeMedicalTheme(), [2.25, 0, 1.75], 0.78]
  ];
  themes.forEach(([theme, position, scale]) => {
    theme.position.set(...position);
    theme.scale.setScalar(scale);
    root.add(theme);
  });
  return root;
}

function buildVisionScene(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const floor = addGrid(root, 10, 20);
  floor.position.set(0, 0, 0);
  const wall = new THREE.GridHelper(10, 20, colors.cyan, colors.violet);
  wall.material.transparent = true;
  wall.material.opacity = 0.32;
  wall.rotation.x = Math.PI / 2;
  wall.position.set(0, 5, -5);
  root.add(wall);

  addMesh(root, new THREE.BoxGeometry(1.4, 0.08, 0.75), neonMat(colors.ink), [-2.2, 0.78, -1.4]);
  addMesh(root, new THREE.BoxGeometry(0.52, 0.34, 0.05), neonMat(colors.cyan), [-2.2, 1.12, -1.74]);
  addMesh(root, new THREE.BoxGeometry(0.06, 0.28, 0.06), neonMat(colors.cyan), [-2.2, 0.88, -1.74]);
  const seated = makePerson();
  seated.position.set(-2.2, 0.12, -0.95);
  seated.rotation.y = -0.2;
  root.add(seated);

  const vrUser = makePerson({ vr: true });
  vrUser.position.set(1.42, 0.12, -0.92);
  vrUser.rotation.y = -0.72;
  root.add(vrUser);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.72, 1.34, -0.42),
    new THREE.Vector3(2.05, 1.72, -0.8),
    new THREE.Vector3(2.42, 1.42, -0.5),
    new THREE.Vector3(2.72, 1.78, -0.9)
  ]);
  const stroke = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)), lineMat(colors.pink, 0.95));
  root.add(stroke);
  addMesh(root, new THREE.TorusGeometry(0.18, 0.018, 6, 20), neonMat(colors.lime), [2.26, 1.6, -0.68], [1, 1, 1], [0.5, 0.2, 0.3]);
  return root;
}

function initScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.dark);
  scene.fog = new THREE.Fog(colors.dark, 8, 20);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const isVision = container.dataset.xrScene === "vision";
  const camera = isVision
    ? new THREE.OrthographicCamera(-4.3, 4.3, 3.2, -3.2, 0.1, 80)
    : new THREE.PerspectiveCamera(42, 1, 0.1, 80);

  camera.position.set(isVision ? 5.6 : 4.8, isVision ? 4.7 : 4.0, isVision ? 5.6 : 6.2);
  camera.lookAt(0, isVision ? 0.85 : 0.7, 0);

  scene.add(new THREE.AmbientLight(0x405070, 1.8));
  const key = new THREE.PointLight(colors.cyan, 2.2, 18);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.PointLight(colors.pink, 1.4, 18);
  rim.position.set(-4, 3, -2);
  scene.add(rim);

  const root = isVision ? buildVisionScene(scene) : buildHeroScene(scene);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    if (camera.isPerspectiveCamera) camera.aspect = width / height;
    if (camera.isOrthographicCamera) {
      const aspect = width / height;
      camera.left = -3.5 * aspect;
      camera.right = 3.5 * aspect;
      camera.top = 3.5;
      camera.bottom = -3.5;
    }
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  function animate(time) {
    const t = time * 0.001;
    if (!isVision) {
      root.rotation.y = Math.sin(t * 0.28) * 0.1;
      root.children.forEach((child, index) => {
        if (index > 3) child.position.y = Math.sin(t * 1.2 + index) * 0.045;
      });
    } else {
      root.rotation.y = Math.sin(t * 0.2) * 0.035;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

document.querySelectorAll("[data-xr-scene]").forEach(container => {
  try {
    if (container.dataset.xrScene === 'hero') initPlayground(container);
    
    else initScene(container);
  } catch (error) {
    console.warn('XR scene unavailable:', error);
    container.dataset.sceneState = 'unavailable';
  }
});






