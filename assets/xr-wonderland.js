import * as THREE from 'three';

// Geometry-only foundation; the previous research exhibits remain in xr-playground.js.
export function initPlayground(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#090d1b');
  scene.fog = new THREE.FogExp2('#090d1b', .025);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute('aria-hidden','true');
  container.appendChild(renderer.domElement);
  const camera=new THREE.OrthographicCamera(-12,12,9,-9,.1,250);
  const target=new THREE.Vector3(0,.75,0);
  // 45-degree azimuth, 45-degree elevation, zero roll. +X/+Z stage corner faces camera.
  camera.position.copy(target).add(new THREE.Vector3(20,20*Math.SQRT2,20));
  camera.lookAt(target);
  const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.12,flatShading:true});
  const stone=mat('#455571'),side=mat('#273449');
  const glass=(color,opacity=.38)=>new THREE.MeshPhysicalMaterial({color,transparent:true,opacity,roughness:.25,metalness:.08,flatShading:true,depthWrite:false,side:THREE.DoubleSide});
  function mesh(geometry,material,pos,parent=scene) {
    const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.castShadow=!material.transparent;m.receiveShadow=true;parent.add(m);return m;
  }
  function edge(obj,color,opacity=.4){const e=new THREE.LineSegments(new THREE.EdgesGeometry(obj.geometry,25),new THREE.LineBasicMaterial({color,transparent:true,opacity}));obj.add(e);return e;}
  scene.add(new THREE.HemisphereLight(0xdceaff,0x282038,2.5));
  const key=new THREE.DirectionalLight(0xffe9d7,3.5);key.position.set(-8,18,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-15,right:15,top:15,bottom:-15});key.shadow.normalBias=.035;scene.add(key);
  const fill=new THREE.DirectionalLight(0x6d9cff,2);fill.position.set(8,6,-6);scene.add(fill);
  const floor=mesh(new THREE.PlaneGeometry(400,400),mat('#111a2b'),[0,-.035,0]);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  const grid=new THREE.GridHelper(400,400,0x678aa0,0x33485f);grid.material.transparent=true;grid.material.opacity=.48;scene.add(grid);
  // Grid-aligned square prisms form a tangible pin-table landscape around a flat clearing.
  for(let x=-8;x<=8;x++)for(let z=-8;z<=8;z++){
    if(Math.abs(x)<4 && Math.abs(z)<4)continue;
    if(Math.abs(x)+Math.abs(z)>12)continue;
    const wave=(Math.sin(x*.78+z*.23)+Math.cos(z*.85-x*.28)+2)/4;
    const h=.14+Math.pow(wave,2)*2.7;
    const bar=mesh(new THREE.BoxGeometry(.92,h,.92),[side,side,stone,side,side,side],[x,h/2,z]);
    edge(bar,0x7095b2,.16);
  }
  // Three square terraces, aligned with the world grid, not the camera plane.
  for(let i=0;i<3;i++){
    const width=5.8-i*.65;
    const step=mesh(new THREE.BoxGeometry(width,.24,width),mat(['#526781','#627b94','#7790a5'][i]),[0,.12+i*.24,0]);
    edge(step,0x8cd7ed,.5);
  }
  // A cubic projection of a tesseract balanced exactly on its lowest outer vertex.
  const tess=new THREE.Group();scene.add(tess);
  tess.quaternion.setFromUnitVectors(new THREE.Vector3(1,1,1).normalize(),new THREE.Vector3(0,1,0));
  tess.position.set(0,.72+Math.sqrt(3)*1.2,0);
  const shell=mesh(new THREE.BoxGeometry(2.4,2.4,2.4),glass('#68d5ee',.12),[0,0,0],tess);edge(shell,0x87edff,.95);
  const inner=mesh(new THREE.BoxGeometry(1.13,1.13,1.13),glass('#ac89f1',.24),[0,0,0],tess);edge(inner,0xd0a5ff,.95);
  const connectors=[];
  for(let i=0;i<8;i++){
    const v=new THREE.Vector3(i&1?1:-1,i&2?1:-1,i&4?1:-1);
    connectors.push(v.clone().multiplyScalar(.565),v.clone().multiplyScalar(1.2));
    mesh(new THREE.IcosahedronGeometry(.045,0),new THREE.MeshBasicMaterial({color:0xb1ebff}),v.clone().multiplyScalar(1.2).toArray(),tess);
  }
  tess.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(connectors),new THREE.LineBasicMaterial({color:0xbca8ff,transparent:true,opacity:.8})));
  const forms=[];
  const specs=[[-5,-3,1.7,.8,1.05,'#ed728e',false],[-6,1,.85,1.5,.9,'#6599f5',true],[4,-5,1.4,.85,.95,'#7fd3ed',false],[6,-1,.9,1.5,.85,'#ed809b',true],[1,-6,1.15,.75,1.5,'#779deb',false],[-2,6,1.2,1.6,.8,'#ee9bac',true]];
  for(const [x,z,sx,sy,sz,color,ovoid] of specs){
    const geo=new THREE.SphereGeometry(1,16,10);
    if(ovoid){const p=geo.attributes.position;for(let i=0;i<p.count;i++){const taper=1-.24*p.getY(i);p.setX(i,p.getX(i)*taper);p.setZ(i,p.getZ(i)*taper);}geo.computeVertexNormals();}
    const wave=(Math.sin(x*.78+z*.23)+Math.cos(z*.85-x*.28)+2)/4;
    const y=.14+wave*wave*2.7+sy+.25;
    const obj=mesh(geo,glass(color),[x,y,z]);obj.scale.set(sx,sy,sz);obj.rotation.set(.1,x*.17,.25);edge(obj,color,.23);forms.push({obj,y});
  }
  // Open ruled ribbons, rather than flat lines: orange translucent motion envelopes.
  function ribbon(points,width){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const vertices=[],indices=[],samples=72;
    for(let i=0;i<=samples;i++){
      const t=i/samples,p=curve.getPoint(t),tangent=curve.getTangent(t);
      const across=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,1,0)).normalize();
      across.applyAxisAngle(tangent,Math.sin(t*Math.PI*2)*.8);
      const w=width*(.15+.85*Math.sin(Math.PI*t));
      vertices.push(...p.clone().addScaledVector(across,w).toArray(),...p.clone().addScaledVector(across,-w).toArray());
      if(i<samples){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,glass('#ffab60',.44),[0,0,0]);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(samples)),new THREE.LineBasicMaterial({color:0xffbf83,transparent:true,opacity:.7})));
  }
  ribbon([[-7,3,-5],[-4,5,-6],[0,5.6,-6],[4,4.8,-5],[7,4,-3]],.45);
  ribbon([[-7,1.6,4],[-6,3,6],[-3,4.1,7],[0,3.3,7],[3,2.5,6]],.34);
  // Explicit XYZ triad at a world-aligned point in the flat foreground.
  const origin=new THREE.Vector3(-6.5,.06,3.5);
  [[new THREE.Vector3(1,0,0),0xf47e92,'X'],[new THREE.Vector3(0,1,0),0x9bd39f,'Y'],[new THREE.Vector3(0,0,1),0x7daaff,'Z']].forEach(([dir,color,label])=>{
    scene.add(new THREE.ArrowHelper(dir,origin,1.8,color,.25,.12));
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');ctx.font='bold 42px sans-serif';ctx.fillStyle='#'+color.toString(16);ctx.textAlign='center';ctx.fillText(label,32,48);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthTest:false}));sprite.position.copy(origin).addScaledVector(dir,2.1);sprite.scale.set(.42,.42,1);scene.add(sprite);
  });
  let visible=true,frame=0;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  function render(){renderer.render(scene,camera);}
  function resize(){const w=Math.max(container.clientWidth,1),h=Math.max(container.clientHeight,1),a=w/h;const half=Math.max(10.2,12/a);camera.left=-half*a;camera.right=half*a;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer.setSize(w,h,false);render();}
  function animate(time){frame=0;if(!visible||document.hidden||motion.matches)return;forms.forEach(({obj,y},i)=>{obj.position.y=y+Math.sin(time*.0006+i)*.08;});render();frame=requestAnimationFrame(animate);}
  function resume(){cancelAnimationFrame(frame);render();if(visible&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(animate);}
  new ResizeObserver(resize).observe(container);new IntersectionObserver(([e])=>{visible=e.isIntersecting;resume();}).observe(container);
  document.addEventListener('visibilitychange',resume);motion.addEventListener('change',resume);resize();resume();container.dataset.sceneState='ready';
}

