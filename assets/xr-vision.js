import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function initVision(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#111218');
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, .1, 60);
  camera.position.set(9, 7, 9);
  camera.lookAt(0, 1.2, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), .23, .5, .85));
  composer.addPass(new OutputPass());
  const material = (color, roughness = .6) => new THREE.MeshStandardMaterial({color, roughness, metalness: .12});
  const graphite = material('#22232d');
  const skin = material('#c9cbd7', .48);
  const cyan = new THREE.MeshStandardMaterial({color:'#75eaff',emissive:'#37cfff',emissiveIntensity:2});
  const pink = new THREE.MeshStandardMaterial({color:'#f9a1f5',emissive:'#ed61e9',emissiveIntensity:2});
  function mesh(parent, geometry, mat, pos, scale = [1,1,1]) {
    const obj = new THREE.Mesh(geometry, mat);
    obj.position.set(...pos); obj.scale.set(...scale);
    obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
  }
  function box(parent, pos, size, mat = graphite, radius = .025) {
    return mesh(parent,new RoundedBoxGeometry(...size,3,radius),mat,pos);
  }
  function ball(parent,pos,size,mat=skin) {
    return mesh(parent,new THREE.SphereGeometry(1,24,16),mat,pos,size);
  }
  function rod(parent,a,b,r,mat=skin) {
    const av=new THREE.Vector3(...a), bv=new THREE.Vector3(...b), d=bv.clone().sub(av);
    const obj=mesh(parent,new THREE.CylinderGeometry(r,r,d.length(),16),mat,av.clone().add(bv).multiplyScalar(.5).toArray());
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); return obj;
  }
  function limb(parent,points,r) {
    points.forEach(p=>ball(parent,p,[r,r,r]));
    for(let i=1;i<points.length;i++) rod(parent,points[i-1],points[i],r);
  }
  // A square stage viewed on its diagonal keeps its nearest corner centered.
  box(scene,[0,-.14,0],[7.5,.28,7.5],material('#171923'),.02);
  const grid = new THREE.GridHelper(7.5,24,0x755b9c,0x59416d);
  grid.position.y=.008; grid.material.transparent=true; grid.material.opacity=.55; scene.add(grid);
  const edge=3.75;
  [[[-edge,.025,edge],[edge,.025,edge]],[[edge,.025,edge],[edge,.025,-edge]]].forEach(([a,b])=>rod(scene,a,b,.011,pink));
  const ground=mesh(scene,new THREE.PlaneGeometry(200,200),material('#101116',.85),[0,-.3,0]);
  ground.rotation.x=-Math.PI/2;
  scene.add(new THREE.HemisphereLight(0xc3d7ff,0x333047,2));
  const key=new THREE.DirectionalLight(0xf0edff,3.2); key.position.set(-3,8,6); key.castShadow=true;
  key.shadow.mapSize.set(2048,2048); Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6}); key.shadow.normalBias=.025; scene.add(key);
  [[0xff70dc,[-4,3,1],12],[0x6ce4ff,[3,4,3],10]].forEach(([color,pos,power])=>{const l=new THREE.PointLight(color,power,12,2);l.position.set(...pos);scene.add(l);});

  function person(parent,seated=false) {
    const hip=seated? .88:1.35, shoulder=hip+.68;
    // Smooth single trunk: neutral mannequin with no sculpted rear or gendered details.
    const profile=[[.16,0],[.23,.08],[.23,.25],[.22,.40],[.29,.62],[.25,.73],[.13,.78]];
    const torso=mesh(parent,new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),32),skin,[0,hip-.10,0],[1,1,.68]);
    ball(parent,[0,shoulder+.25,0],[.105,.16,.105]);
    ball(parent,[0,shoulder+.51,0],[.235,.30,.22]);
    for(const s of [-1,1]) {
      const legs=seated?[[s*.15,hip,0],[s*.19,.78,.48],[s*.19,.15,.55]]:[[s*.15,hip,0],[s*.19,.69,.025],[s*.23,.14,.08]];
      limb(parent,legs,.105);
      ball(parent,[s*(seated?.19:.23),.10,seated?.68:.21],[.12,.10,.24]);
    }
    return {shoulder};
  }
  const desk=new THREE.Group(); desk.position.set(-1.65,0,1.0); desk.rotation.y=.15;scene.add(desk);
  box(desk,[0,1.02,.7],[1.95,.10,1]);
  for(const x of [-.86,.86]) for(const z of [.3,1.10]) box(desk,[x,.5,z],[.065,1,.065]);
  box(desk,[0,.72,-.10],[.64,.12,.57]);
  box(desk,[0,1.13,-.36],[.65,.79,.10]);
  rod(desk,[0,.15,-.10],[0,.69,-.10],.055,graphite);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod(desk,[0,.15,-.10],[Math.cos(a)*.37,.07,Math.sin(a)*.37-.10],.028,graphite);}
  const seated=new THREE.Group();desk.add(seated);const seatedBody=person(seated,true);
  for(const s of [-1,1]) limb(seated,[[s*.25,seatedBody.shoulder,0],[s*.36,1.19,.25],[s*.25,1.13,.59]],.07);
  for(const s of [-1,1]) ball(seated,[s*.25,1.115,.65],[.10,.045,.14]);
  box(desk,[0,1.09,.64],[.63,.035,.22]);
  for(let row=0;row<3;row++) for(let col=0;col<10;col++) box(desk,[-.27+col*.06,1.112,.56+row*.055],[.041,.012,.035],material('#454654'),.003);
  box(desk,[0,1.10,1.02],[.37,.04,.23]);box(desk,[0,1.32,1.03],[.07,.42,.07]);
  box(desk,[0,1.63,1.03],[1.07,.67,.07]);
  box(desk,[0,1.63,.987],[.98,.58,.008],material('#163446'),.015);
  box(desk,[0,1.63,1.071],[.065,.08,.008],material('#626272'),.008);

  const vr=new THREE.Group(); vr.position.set(1.25,0,-.75); vr.rotation.y=.48; scene.add(vr);
  const body=person(vr);
  box(vr,[0,body.shoulder+.52,.20],[.50,.24,.24],graphite,.065);
  box(vr,[0,body.shoulder+.52,.327],[.44,.185,.015],material('#18213b'),.04);
  const visorEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.45,.19,.02)),new THREE.LineBasicMaterial({color:0xcf87ff}));
  visorEdges.position.set(0,body.shoulder+.52,.332); vr.add(visorEdges);
  const band=mesh(vr,new THREE.TorusGeometry(.235,.033,8,40),graphite,[0,body.shoulder+.53,0],[1,1,.9]);band.rotation.x=Math.PI/2;
  const hands=[[-.44,1.96,.74],[.44,2.34,.83]];
  limb(vr,[[-.26,body.shoulder,0],[-.43,1.70,.32],hands[0]],.073);
  limb(vr,[[.26,body.shoulder,0],[.54,1.98,.35],hands[1]],.073);
  hands.forEach((p,index)=>{
    ball(vr,p,[.08,.115,.052]);
    for(let f=0;f<4;f++) {
      const start=[p[0]-.052+f*.033,p[1]+.06,p[2]];
      const end=[start[0],start[1]+.095+(f===1?.025:0),start[2]+.045];
      limb(vr,[start,end],.014);
    }
    limb(vr,[[p[0]+(index?-.07:.07),p[1],p[2]],[p[0]+(index?-.10:.10),p[1]+.05,p[2]+.04]],.021);
  });
  const hologram=new THREE.Group();hologram.position.set(0,2.17,.99);hologram.rotation.set(.15,.25,.06);vr.add(hologram);
  const vertices=[];
  for(const scale of [.50,.24]) for(let i=0;i<8;i++) vertices.push([(i&1?1:-1)*scale,(i&2?1:-1)*scale,(i&4?1:-1)*scale]);
  for(let layer=0;layer<2;layer++) for(let i=0;i<8;i++) {
    const a=vertices[layer*8+i]; ball(hologram,a,[.022,.022,.022],layer?pink:cyan);
    for(const bit of [1,2,4]) if(!(i&bit)) rod(hologram,a,vertices[layer*8+(i|bit)],.007,layer?pink:cyan);
    if(layer===0) rod(hologram,a,vertices[i+8],.004,cyan);
  }
  mesh(hologram,new THREE.BoxGeometry(1,1,1),new THREE.MeshPhysicalMaterial({color:0x73d9ff,transparent:true,opacity:.045,roughness:.2,metalness:0,depthWrite:false,side:THREE.DoubleSide}),[0,0,0]);
  function panel(x,y,z,angle) {
    const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;vr.add(g);
    mesh(g,new THREE.PlaneGeometry(.82,.92),new THREE.MeshBasicMaterial({color:0x66b9ec,transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false}),[0,0,0]);
    const line=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(.82,.92)),new THREE.LineBasicMaterial({color:0x6ac8f0,transparent:true,opacity:.5}));g.add(line);
    for(let i=0;i<3;i++) {const ring=mesh(g,new THREE.TorusGeometry(.25,.002,4,64),new THREE.MeshBasicMaterial({color:0x9c9bef}),[0,0,.015]);ring.rotation.set(i*.65,i*.75,.3);}
    ball(g,[0,0,.03],[.017,.017,.017],pink);
  }
  panel(-1.04,2.55,1.30,.4);panel(1.02,2.55,1.30,-.4);
  function plinth(pos,height,neon=false) {
    box(scene,[pos[0],height/2,pos[1]],[.43,height,.43]);
    if(neon) rod(scene,[pos[0]+.22,.18,pos[1]+.12],[pos[0]+.22,height-.18,pos[1]+.12],.014,pink);
  }
  plinth([-3,-1.2],2.6,true);plinth([2.7,-2.6],2.15,true);plinth([3,-1.65],.88);
  ball(scene,[3,1.07,-1.65],[.19,.19,.19],pink);
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=true;
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(container);
  function resize() {
    const w=Math.max(container.clientWidth,1),h=Math.max(container.clientHeight,1),aspect=w/h;
    const halfHeight=Math.max(3.35,5.65/aspect);
    camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);composer.setSize(w,h);
  }
  new ResizeObserver(resize).observe(container);resize();
  renderer.setAnimationLoop(time=>{
    if(!visible||document.hidden)return;
    hologram.rotation.y=.25+(reduceMotion.matches?0:Math.sin(time*.0003)*.10);
    composer.render();
  });
  container.dataset.sceneState='ready';
}
