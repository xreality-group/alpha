import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#190c2c');
scene.fog = new THREE.FogExp2('#190c2c', .022);
const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, .1, 180);
camera.position.set(16, 10, 29);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.prepend(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, -2);
controls.enableDamping = true;
controls.minDistance = 12; controls.maxDistance = 65;
controls.maxPolarAngle = Math.PI / 2 - .025;
controls.update();
const editable = [];
const modelMotions = [];
const defaults = new Map();
const storageKey = 'neon-geometry-transforms-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}
const picker = document.querySelector('#object-picker');
const editor = document.querySelector('#editor');
const status = document.querySelector('#edit-status');
const gizmo = new TransformControls(camera, renderer.domElement);
gizmo.setSize(.8);
scene.add(gizmo);
gizmo.addEventListener('dragging-changed', e => { controls.enabled = editor.open && !e.value; });
const uniformScale = document.querySelector('#uniform-scale');
let scaleAtDragStart;
gizmo.addEventListener('mouseDown', () => {
  scaleAtDragStart = gizmo.object?.scale.clone();
});
gizmo.addEventListener('objectChange', () => {
  if (!uniformScale.checked || gizmo.mode !== 'scale' || !gizmo.dragging || !scaleAtDragStart) return;
  const axis = gizmo.axis;
  const component = axis === 'Y' ? 'y' : axis === 'Z' ? 'z' : 'x';
  const start = scaleAtDragStart[component];
  if (Math.abs(start) < 1e-8) return;
  const factor = gizmo.object.scale[component] / start;
  gizmo.object.scale.copy(scaleAtDragStart).multiplyScalar(factor);
});
gizmo.addEventListener('mouseUp', () => {scaleAtDragStart = undefined;});
function snapshot(obj) {
  return {position:obj.position.toArray(),quaternion:obj.quaternion.toArray(),scale:obj.scale.toArray()};
}
function restore(obj, data) {
  if (!data || ![data.position,data.quaternion,data.scale].every(Array.isArray)) return;
  if (data.position.length!==3 || data.quaternion.length!==4 || data.scale.length!==3 ||
      ![...data.position,...data.quaternion,...data.scale].every(Number.isFinite)) return;
  obj.position.fromArray(data.position);obj.quaternion.fromArray(data.quaternion);obj.scale.fromArray(data.scale);
}
function registerEditable(obj, id, label) {
  obj.userData.editId = id;
  editable.push(obj);defaults.set(id,snapshot(obj));restore(obj,saved[id]);
  picker.add(new Option(label,id));
}
function selectObject(obj) {
  if(obj) {gizmo.attach(obj);picker.value=obj.userData.editId;}
  else {gizmo.detach();picker.value='';}
}
picker.onchange=()=>selectObject(editable.find(obj=>obj.userData.editId===picker.value));
for(const button of document.querySelectorAll('[data-mode]')) button.onclick=()=>{
  gizmo.setMode(button.dataset.mode);
  for(const other of document.querySelectorAll('[data-mode]')) other.setAttribute('aria-pressed',String(other===button));
};
document.querySelector('#edit-space').onchange=e=>gizmo.setSpace(e.target.value);
document.querySelector('#save-edits').onclick=()=>{
  const data=Object.fromEntries(editable.map(obj=>[obj.userData.editId,snapshot(obj)]));
  try {localStorage.setItem(storageKey,JSON.stringify(data));status.textContent='Saved in this browser.';}
  catch {status.textContent='Browser storage unavailable. Use Export instead.';}
};
document.querySelector('#reset-edit').onclick=()=>{
  if(gizmo.object) {restore(gizmo.object,defaults.get(gizmo.object.userData.editId));status.textContent='Selected object reset. Save to keep it.';}
};
document.querySelector('#export-edits').onclick=()=>{
  const data=Object.fromEntries(editable.map(obj=>[obj.userData.editId,snapshot(obj)]));
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='neon-geometry-transforms.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let down;
function syncInteraction() {
  controls.enabled = editor.open && !gizmo.dragging;
  gizmo.enabled = editor.open;
  renderer.domElement.style.pointerEvents = editor.open ? 'auto' : 'none';
  renderer.domElement.style.touchAction = editor.open ? 'none' : 'auto';
  if (!editor.open) {
    down = undefined;
    selectObject();
  }
}
editor.addEventListener('toggle', syncInteraction);
syncInteraction();
// A collapsed scene lives inside an iframe: forward wheel scrolling to the page.
addEventListener('wheel', e => {
  if (editor.open || window.parent === window || e.ctrlKey) return;
  if (e.target.closest?.('details[open]')) return;
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
  try {
    window.parent.scrollBy({left: e.deltaX * unit, top: e.deltaY * unit, behavior: 'instant'});
    e.preventDefault();
  } catch { /* Cross-origin embeds keep their normal browser behavior. */ }
}, {passive: false});
renderer.domElement.addEventListener('pointerdown',e=>{if(editor.open)down={x:e.clientX,y:e.clientY,gizmo:!!gizmo.axis};});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!editor.open || !down || down.gizmo || gizmo.dragging || Math.hypot(e.clientX-down.x,e.clientY-down.y)>4) return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(editable,true).find(hit=>hit.object.isMesh);
  let obj=hit?.object;
  while(obj && !obj.userData.editId) obj=obj.parent;
  selectObject(obj);
});
addEventListener('keydown',e=>{
  if(!editor.open) return;
  if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)) return;
  if(e.key==='Escape')selectObject();
  const mode={w:'translate',e:'rotate',r:'scale'}[e.key.toLowerCase()];
  if(mode)document.querySelector(`[data-mode="${mode}"]`).click();
});
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .65, .65, .72));
scene.add(new THREE.AmbientLight('#8653b0', 1.1));
for (const [color, intensity, x,y,z] of [['#ff36ca',65,8,7,3],['#1bdfff',65,-9,6,3],['#b450ff',55,0,10,-12]]) {
 const light = new THREE.PointLight(color,intensity,45,1.5); light.position.set(x,y,z); scene.add(light);
}
const blue = new THREE.DirectionalLight('#397dff', 2.5); blue.position.set(-10,7,3);scene.add(blue);
const pink = new THREE.DirectionalLight('#ff5acb', 3.5); pink.position.set(10,8,-3);scene.add(pink);
const material = (color) => new THREE.MeshStandardMaterial({color,metalness:.32,roughness:.38,flatShading:true});
function mesh(geo,mat,pos,parent=scene){const obj=new THREE.Mesh(geo,mat);obj.position.set(...pos);parent.add(obj);return obj;}
function wire(obj,color='#d681ff',opacity=.23){obj.add(new THREE.LineSegments(new THREE.WireframeGeometry(obj.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity})));}
const floor=mesh(new THREE.PlaneGeometry(180,180),material('#160b25'),[0,-.05,0]);floor.rotation.x=-Math.PI/2;
const grid=new THREE.GridHelper(160,100,'#ad39c5','#6a236c');grid.material.transparent=true;grid.material.opacity=.46;scene.add(grid);
function gradient(geometry){const p=geometry.attributes.position, colors=[];for(let i=0;i<p.count;i++){const t=THREE.MathUtils.clamp((p.getX(i)+4)/8,0,1);const c=new THREE.Color('#1267c3').lerp(new THREE.Color('#ff52ce'),t);colors.push(c.r,c.g,c.b);}geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,metalness:.22,roughness:.4,flatShading:true});}
// A triangulated mathematical landscape with two distinct peaks.
const waveGeo=new THREE.PlaneGeometry(12,8,36,24);waveGeo.rotateX(-Math.PI/2);
const positions=waveGeo.attributes.position;
for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);const h=4.7*Math.exp(-((x+2.4)**2/4+(z+.8)**2/5))+2.8*Math.exp(-((x-3.5)**2/1.7+(z-1.5)**2/3));positions.setY(i,h+.15);}
waveGeo.computeVertexNormals();const wave=mesh(waveGeo,gradient(waveGeo),[-8,0,0]);wire(wave,'#bd9bff',.19);
const ringGeo=new THREE.TorusGeometry(3.8,1.05,16,64);const ring=mesh(ringGeo,gradient(ringGeo),[4,2.3,1]);ring.rotation.set(1.05,.26,-.32);wire(ring,'#f7adff',.22);
// Measure the rotated geometry so even its lowest vertex clears the grid.
ring.updateMatrixWorld(true);
ring.position.y += .35 - new THREE.Box3().setFromObject(ring).min.y;
const wcs = new THREE.Group(); wcs.name = 'World Coordinate System'; scene.add(wcs);
for (const [axis,color,position,size] of [
  ['X','#ef4444',[1.5,0,0],[3,.07,.07]],
  ['Y','#42df75',[0,1.5,0],[.07,3,.07]],
  ['Z','#448dff',[0,0,1.5],[.07,.07,3]]
]) {
  const bar = mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color}),position,wcs);
  bar.name = `${axis} axis`;
}

const loader = new GLTFLoader();
const normalMaterial = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
// Keep the normal palette below the bloom threshold instead of washing it white.
normalMaterial.toneMapped = false;
normalMaterial.onBeforeCompile = shader => {
  shader.fragmentShader = shader.fragmentShader.replace(
    'gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',
    'gl_FragColor = vec4( pow( packNormalToRGB( normal ), vec3(1.4) ) * 0.45, opacity );'
  );
};
normalMaterial.customProgramCacheKey = () => 'muted-normal-palette-v2';
const modelSpecs = [
  ['Character Base by madtrollstudio - qbDLeTtb8K.glb', -5, 6, 2.5],
  ['Donut by Poly by Google - 8KY9R5UDV_M.glb', -3, -5, 1.8],
  ['Heart by Poly by Google - 5POtMKIT_Ze.glb', 1, -6, 1.8],
  ['Paint brush by jeremy - 5Q3oOgvaZUR.glb', 5, -6, 2.5],
  ['paint kit mini by Tiff Eidmann - 2_FO0E5vFOc.glb', 9, -8, 2.4],
  ['Ramen by Quaternius - DTOzkHhvDK.glb', -6, -7, 2.2],
  ['skull oculus rift by Robin Goldenberg - 2vPmLo3c734.glb', 13, -5, 2.2],
  ['Tablet by Poly by Google - 2LxocCCiDy-.glb', -1, -10, 2],
  ['xreality-playground.glb', -2, 3, 3.5, 'Kinect One — 25 joint skeleton']
];
function placeModel(model, x, z, size, name) {
  model.traverse(child => {
    if (!child.isMesh) return;
    // Some Poly Pizza assets contain positions and UVs but no normals.
    if (!child.geometry.getAttribute('normal')) child.geometry.computeVertexNormals();
    child.material = normalMaterial;
  });
  const wrapper = new THREE.Group(); wrapper.name = name; wrapper.add(model);
  let clearance = .15;
  if (name.startsWith('Donut by')) wrapper.rotation.x = Math.PI / 2;
  if (name.startsWith('Tablet by')) wrapper.rotation.x = Math.PI / 2 - .22;
  if (name.startsWith('Paint brush by')) {
    // The bristles are at +X in the source mesh; point that end downward.
    wrapper.rotation.z = -Math.PI / 2 + .28;
    wrapper.rotation.y = -.25;
    clearance = 0;
  }
  wrapper.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(wrapper, true);
  const extent = bounds.getSize(new THREE.Vector3());
  wrapper.scale.setScalar(size / Math.max(extent.x,extent.y,extent.z));
  wrapper.updateMatrixWorld(true);
  bounds.setFromObject(wrapper, true);
  const center = bounds.getCenter(new THREE.Vector3());
  wrapper.position.set(x-center.x,clearance-bounds.min.y,z-center.z);
  scene.add(wrapper);
  // Center the editing pivot without changing the model's current placement.
  wrapper.updateMatrixWorld(true);
  const pivot = new THREE.Group();
  pivot.position.copy(new THREE.Box3().setFromObject(wrapper,true).getCenter(new THREE.Vector3()));
  scene.add(pivot);pivot.attach(wrapper);
  registerEditable(pivot,`model:${name}`,name.replace(/ - .*\.glb$/,'').replace('.glb',''));
  if (name.startsWith('Donut by')) {
    const baseY = wrapper.position.y;
    // The nested wrapper animates independently of the user's editable transform.
    modelMotions.push({pivot,update:time=>{wrapper.position.y=baseY+.35*(1-Math.cos(time*1.1));}});
  }
  if (name.startsWith('Heart by')) {
    const baseRotation = wrapper.rotation.y;
    modelMotions.push({pivot,update:time=>{wrapper.rotation.y=baseRotation-time*.12;}});
  }
}
for (const [file,x,z,size,selection] of modelSpecs) {
  loader.load(new URL(`../3dmodels/${encodeURIComponent(file)}`,import.meta.url).href, gltf => {
    let model = gltf.scene;
    if(selection) {
      let selected;
      model.traverse(obj => {if(obj.name === selection || obj.name.startsWith('Kinect_One')) selected=obj;});
      if(!selected) {reportModelError(file);return;}
      // Preserve the selected figure's complete transform before detaching it.
      model.updateMatrixWorld(true);
      const transform = selected.matrixWorld.clone();
      selected.removeFromParent();
      transform.decompose(selected.position,selected.quaternion,selected.scale);
      model=selected;
    }
    placeModel(model,x,z,size,selection || file);
  },undefined,()=>reportModelError(file));
}
function reportModelError(file) {
  console.error(`Unable to load ${file}`);
  const error=document.querySelector('#error');
  error.style.cssText='display:block;inset:auto 24px 75px;max-width:420px;font-size:12px';
  error.textContent=location.protocol==='file:'
    ? 'Serve this page over HTTP to load local GLB models; browsers block model requests from file URLs.'
    : `Could not load model: ${file}. See the browser console for details.`;
}
const animated=[];
// Five pairs in the torus's +X/+Z quadrant, spaced clear of its silhouette.
function roundedPair(kind, x, z, axes, spacing, poses) {
  const group = new THREE.Group();
  group.name = `${kind}-pair`;
  group.position.set(x,0,z);
  scene.add(group);
  for (let i = 0; i < 2; i++) {
    const geometry = new THREE.SphereGeometry(1, 24, 16);
    if (kind === 'ovoid') {
      // Narrow the upper end and broaden the lower end into an egg profile.
      const vertices = geometry.attributes.position;
      for (let j = 0; j < vertices.count; j++) {
        const taper = 1 - .28 * vertices.getY(j);
        vertices.setX(j, vertices.getX(j) * taper);
        vertices.setZ(j, vertices.getZ(j) * taper);
      }
      geometry.computeVertexNormals();
    }
    const obj = mesh(geometry, material(i ? '#f05ac9' : '#45c7ed'),
      [(i - .5) * spacing, axes[1] + .12, 0], group);
    obj.name = `${kind}-${i + 1}`;
    obj.scale.set(...axes);
    const pose = poses[i];
    obj.position.add(new THREE.Vector3(...pose.offset));
    obj.rotation.set(...pose.rotation);
    if (spacing < 1.5 && axes[1] > .6) {
      obj.material.transparent = true;
      obj.material.opacity = .25;
      obj.material.depthWrite = false;
      obj.material.side = THREE.DoubleSide;
    }
    wire(obj, i ? '#ffc1ed' : '#9befff', .18);
    registerEditable(obj,`${kind}:${x}:${z}:${i}`,`${kind} (${x}, ${z}) — ${i ? 'pink' : 'cyan'}`);
  }
  registerEditable(group,`${kind}:pair:${x}:${z}`,`${kind} pair (${x}, ${z})`);
}
roundedPair('ellipsoid', 4, 7, [1.25, .65, .8], 1.45, [
  {offset:[0,.65,-.25], rotation:[.3,.45,.4]},
  {offset:[0,1.05,.25], rotation:[-.4,-.6,-.55]}
]);
roundedPair('ellipsoid', 9, 2.5, [.65, 1.2, .65], 1.8, [
  {offset:[-.2,.35,-.4], rotation:[.2,.3,-.4]},
  {offset:[.3,1.7,.5], rotation:[.8,-.5,.75]}
]);
roundedPair('ellipsoid', 7, 10.5, [.75, .4, .5], 1.9, [
  {offset:[0,.65,-.45], rotation:[.5,.8,.65]},
  {offset:[.25,2.2,.35], rotation:[-.65,.2,-.3]}
]);
roundedPair('ovoid', 12.5, 3, [.8, 1.45, .8], 1.05, [
  {offset:[0,.45,-.15], rotation:[.2,.4,-.6]},
  {offset:[0,.9,.15], rotation:[-.3,-.5,.65]}
]);
roundedPair('ovoid', 12.5, 9, [.5, .85, .5], 1.45, [
  {offset:[-.2,.25,-.3], rotation:[.45,.3,-.8]},
  {offset:[.15,1.8,.45], rotation:[-.6,.8,.4]}
]);
function poly(x,y,z,r=1){const obj=mesh(new THREE.IcosahedronGeometry(r,0),material('#b355db'),[x,y,z]);wire(obj,'#cbb4ff',.23);animated.push({obj,y,phase:x});return obj;}
poly(-12,9,-7,1.6);poly(-15,1,6,.9);poly(-18,3,-9,.65);poly(0,8,-15,.5);poly(1,5,-9,.7);
const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:120},(_,i)=>{const a=i/120*Math.PI*2;return new THREE.Vector3(Math.cos(a)*3,Math.sin(a)*.6,Math.sin(a)*1.4);})),new THREE.LineBasicMaterial({color:'#cf6deb',transparent:true,opacity:.6}));orbit.position.set(-12,9,-7);scene.add(orbit);
function box(x,y,z,s=1){return mesh(new THREE.BoxGeometry(s,s,s),material('#b43eae'),[x,y,z]);}
box(10,.7,6,1.4);box(15,.6,-6,1.2);box(4,7,-12,1.9);
const sphere=mesh(new THREE.SphereGeometry(.65,24,16),material('#bf4cc9'),[4,9.1,-12]);animated.push({obj:sphere,y:9.1,phase:3});
for(let i=0;i<10;i++){mesh(new THREE.BoxGeometry(1.9,.22,.55),material('#df56b8'),[-7+i*.45,.22*(10-i),-12+i*.55]);mesh(new THREE.BoxGeometry(2,.25,.6),material('#df56b8'),[13+i*.45,.25*(10-i),-14+i*.6]);}
mesh(new THREE.BoxGeometry(2,6,1.7),material('#703375'),[-10,3,-15]);
mesh(new THREE.ConeGeometry(1,2,4),material('#c26ddc'),[11,1,-2]);
const knot=mesh(new THREE.TorusKnotGeometry(1.4,.38,100,10),new THREE.MeshBasicMaterial({color:'#eb68e1',wireframe:true,transparent:true,opacity:.55}),[13,4,-14]);
// Translucent vertical slices echo the reference's cyan glass geometry.
const glass=new THREE.MeshBasicMaterial({color:'#39cfff',transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false});
mesh(new THREE.PlaneGeometry(3.5,6),glass,[3,3,1]);
function arch(x,z){const a=mesh(new THREE.TorusGeometry(.7,.22,8,24,Math.PI),material('#b33dd0'),[x,2,z]);mesh(new THREE.BoxGeometry(.44,2,.44),material('#547bd5'),[x-.7,1,z]);mesh(new THREE.BoxGeometry(.44,2,.44),material('#d14fca'),[x+.7,1,z]);return a;}
arch(-5,-15);arch(11,-19);arch(0,7);
let seed=72;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<65;i++){const x=(random()-.5)*45,z=(random()-.5)*45,y=.15+random()*4;const dot=mesh(new THREE.SphereGeometry(.035+random()*.085,8,6),new THREE.MeshBasicMaterial({color:i%2?'#ff7ee4':'#70dfff'}),[x,y,z]);if(i%4===0){const line=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,z),new THREE.Vector3(x,y,z)]);scene.add(new THREE.Line(line,new THREE.LineBasicMaterial({color:'#ac5bbe',transparent:true,opacity:.32})));}}
// Low-poly mountains fade into the distant purple horizon.
for(let i=0;i<35;i++){const h=1+random()*3;const mountain=mesh(new THREE.ConeGeometry(3+random()*3,h,4),material('#2b123d'),[-65+i*4,h/2,-38-random()*8]);mountain.rotation.y=random();}
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock=new THREE.Clock();let time=0;
renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05);
  if(!paused){
    time+=dt;
    for(const {obj,y,phase} of animated){obj.rotation.y+=dt*.12;obj.position.y=y+Math.sin(time*.6+phase)*.16;}
    knot.rotation.y+=dt*.12;
    // Premultiply to rotate around world Y while preserving the torus's tilt.
    ring.rotateOnWorldAxis(new THREE.Vector3(0,1,0),dt*.09);
    for(const motion of modelMotions){
      if(gizmo.object!==motion.pivot) motion.update(time);
    }
  }
  controls.update();composer.render();
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
