import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Bounded jitter keeps the exhibits separate. Change this seed for a new layout.
const LAYOUT_SEED = 271828;
const exhibits = [
  ['Character Base by madtrollstudio - qbDLeTtb8K.glb', -5.4, -2.6, 2.1],
  ['Donut by Poly by Google - 8KY9R5UDV_M.glb', -2.8, -3.7, 1.5],
  ['Heart by Poly by Google - 5POtMKIT_Ze.glb', 0.0, -3.4, 1.5],
  ['Paint brush by jeremy - 5Q3oOgvaZUR.glb', 4.5, -3.8, 2.1],
  ['paint kit mini by Tiff Eidmann - 2_FO0E5vFOc.glb', 5.4, -1.1, 1.7],
  ['Ramen by Quaternius - DTOzkHhvDK.glb', -6.0, 0.4, 1.8],
  ['skull oculus rift by Robin Goldenberg - 2vPmLo3c734.glb', 5.7, 2.1, 1.7],
  ['Tablet by Poly by Google - 2LxocCCiDy-.glb', 3.5, 4.0, 1.6]
];
const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.65, flatShading: true });
function mesh(geometry, mat, parent, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function skeleton() {
  const group = new THREE.Group();
  group.name = 'Kinect One — 25 joint skeleton';
  const joints = {
    SpineBase: [0, 1.0, 0], SpineMid: [0, 1.36, 0], SpineShoulder: [0, 1.78, 0],
    Neck: [0, 1.96, 0], Head: [0, 2.2, 0],
    ShoulderLeft: [-0.3, 1.78, 0], ElbowLeft: [-0.65, 1.52, 0.06],
    WristLeft: [-0.95, 1.7, 0.12], HandLeft: [-1.06, 1.77, 0.12],
    HandTipLeft: [-1.18, 1.85, 0.12], ThumbLeft: [-1.03, 1.88, 0.23],
    ShoulderRight: [0.3, 1.78, 0], ElbowRight: [0.65, 2.03, 0.02],
    WristRight: [0.72, 2.37, 0.08], HandRight: [0.74, 2.49, 0.08],
    HandTipRight: [0.76, 2.63, 0.08], ThumbRight: [0.6, 2.48, 0.19],
    HipLeft: [-0.2, 1, 0], KneeLeft: [-0.33, 0.55, 0.09],
    AnkleLeft: [-0.42, 0.12, 0], FootLeft: [-0.42, 0.08, 0.25],
    HipRight: [0.2, 1, 0], KneeRight: [0.4, 0.57, -0.08],
    AnkleRight: [0.55, 0.12, 0], FootRight: [0.55, 0.08, 0.25]
  };
  const chains = [
    ['SpineBase', 'SpineMid', 'SpineShoulder', 'Neck', 'Head'],
    ...['Left', 'Right'].flatMap(side => [
      ['SpineShoulder', `Shoulder${side}`, `Elbow${side}`, `Wrist${side}`, `Hand${side}`, `HandTip${side}`],
      [`Wrist${side}`, `Thumb${side}`],
      ['SpineBase', `Hip${side}`, `Knee${side}`, `Ankle${side}`, `Foot${side}`]
    ])
  ];
  const jointMat = material(0xb8ff5e), boneMat = material(0xe0efff);
  for (const [name, point] of Object.entries(joints)) {
    mesh(new THREE.SphereGeometry(name === 'Head' ? 0.14 : 0.065, 12, 8), jointMat, group, ...point).name = name;
  }
  for (const chain of chains) for (let i = 1; i < chain.length; i++) {
    const a = new THREE.Vector3(...joints[chain[i - 1]]), b = new THREE.Vector3(...joints[chain[i]]);
    const bone = mesh(new THREE.CylinderGeometry(0.026, 0.026, a.distanceTo(b), 8), boneMat, group);
    bone.position.copy(a).add(b).multiplyScalar(0.5);
    bone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  }
  return group;
}

export function initPlayground(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070712);
  scene.fog = new THREE.FogExp2(0x070712, 0.027);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 180);
  scene.add(new THREE.HemisphereLight(0xd7eaff, 0x777197, 2.6));
  const sun = new THREE.DirectionalLight(0xffefdd, 3.2);
  sun.position.set(-3, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11 });
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x8d9cff, 1.6);
  fill.position.set(7, 4, -5);
  scene.add(fill);
  const ground = mesh(new THREE.PlaneGeometry(240, 240), material(0x101426), scene);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.025;
  ground.castShadow = false;
  ground.name = 'Ground plane';
  const grid = new THREE.GridHelper(240, 240, 0x527983, 0x344257);
  grid.material.transparent = true;
  grid.material.opacity = 0.48;
  scene.add(grid);
  grid.name = 'Reference grid';

  let seed = LAYOUT_SEED;
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
  const loader = new GLTFLoader();
  let loaded = 0;
  container.dataset.sceneState = 'loading';
  const loads = exhibits.map(([file, x, z, size]) => {
    // Allocate transforms before loading so network completion order never changes the layout.
    const holder = new THREE.Group();
    holder.name = file;
    holder.position.set(x + (random() - 0.5) * 0.4, 0, z + (random() - 0.5) * 0.4);
    holder.rotation.y = (random() - 0.5) * 0.85;
    const extent = size * (0.94 + random() * 0.12);
    scene.add(holder);
    return loader.loadAsync(new URL(`../3dmodels/${encodeURIComponent(file)}`, import.meta.url).href).then(gltf => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const dimensions = bounds.getSize(new THREE.Vector3());
      const scale = extent / Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001);
      const center = bounds.getCenter(new THREE.Vector3());
      model.scale.multiplyScalar(scale);
      model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z).multiplyScalar(scale));
      model.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
      holder.add(model);
      loaded++;
      container.dataset.loadedModels = String(loaded);
      render();
    }).catch(error => console.warn(`Could not load playground model: ${file}`, error));
  });
  Promise.all(loads).then(() => { container.dataset.sceneState = loaded === exhibits.length ? 'ready' : 'partial'; });

  const figure = skeleton();
  figure.position.set(3.0, 0, -0.1);
  figure.rotation.y = -0.22;
  scene.add(figure);
  const ellipsoids = new THREE.Group();
  ellipsoids.name = 'Collision ellipsoids';
  ellipsoids.position.set(-0.4, 1.2, -0.7);
  scene.add(ellipsoids);
  [0xff3857, 0x368cff].forEach((color, i) => {
    const mat = new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.55,
      roughness: 0.18, metalness: 0.05, clearcoat: 1, depthWrite: false, flatShading: true });
    const body = mesh(new THREE.IcosahedronGeometry(1, 2), mat, ellipsoids, i ? 0.56 : -0.56);
    body.name = i ? 'Blue ellipsoid' : 'Red ellipsoid';
    body.scale.set(1.1, 0.72, 0.8);
    body.rotation.set(0.1, i ? -0.35 : 0.3, i ? -0.4 : 0.35);
  });
  const torus = mesh(new THREE.TorusKnotGeometry(0.53, 0.12, 64, 6), material(0xc797ff), scene, -4.2, 1.15, -0.4);
  torus.rotation.x = 0.4;
  torus.name = 'Torus knot';
  const saddleGeometry = new THREE.PlaneGeometry(1.8, 1.8, 9, 9);
  const positions = saddleGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getY(i);
    positions.setXYZ(i, x, (x * x - z * z) * 0.45, z);
  }
  saddleGeometry.computeVertexNormals();
  const saddleMat = material(0xffbe69);
  saddleMat.side = THREE.DoubleSide;
  mesh(saddleGeometry, saddleMat, scene, 1.8, 0.65, -5.8).name = 'Saddle surface';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = new THREE.Vector2();
  let visible = true, frame = 0, baseDistance = 17;
  const hero = container.closest('.hero');
  hero.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width - 0.5, (event.clientY - rect.top) / rect.height - 0.5);
  });
  hero.addEventListener('pointerleave', () => pointer.set(0, 0));
  function render() { renderer.render(scene, camera); }
  function resize() {
    const width = Math.max(container.clientWidth, 1), height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    baseDistance = camera.aspect < 0.8 ? Math.max(26, 16 / camera.aspect) : 17;
    camera.position.set(0, baseDistance * 0.66, baseDistance);
    camera.lookAt(0, 0, camera.aspect < 0.8 ? 2.8 : 3.0);
    camera.updateProjectionMatrix();
    render();
  }
  new ResizeObserver(resize).observe(container);
  resize();
  function animate(time) {
    frame = 0;
    if (!visible || document.hidden || reducedMotion.matches) return;
    const t = time * 0.001;
    ellipsoids.rotation.y = Math.sin(t * 0.25) * 0.12;
    torus.rotation.y = t * 0.13;
    camera.position.x += (pointer.x * 0.65 - camera.position.x) * 0.035;
    camera.position.y += (baseDistance * 0.66 + pointer.y * 0.3 - camera.position.y) * 0.035;
    camera.lookAt(0, 0, 3);
    render();
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
    else render();
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }).observe(container);
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', resume);
  resume();
}

