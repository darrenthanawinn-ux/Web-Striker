'use strict';
const $=i=>document.getElementById(i),V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
const S={q:'High',fov:80,lag:.5,assist:true,vol:.6,sfx:.8,tod:'Golden',vel:true,map:true,lines:true,bars:false};
const K={swing:'Space',zip:'ShiftLeft',dive:'KeyF'};
const Q={Low:{sh:0,rad:1,pr:1},Medium:{sh:1024,rad:2,pr:1.25},High:{sh:2048,rad:2,pr:1.5},Ultra:{sh:4096,rad:3,pr:2}};
const TOD={Golden:{sky:0xff9a5a,fog:0xe89a6a,sun:0xffc080,si:1.2,d:[-1,.35,-.5],win:.15,hm:.7},
 Midday:{sky:0x7ec8ff,fog:0xbfe0f5,sun:0xffffff,si:1.4,d:[.3,1,.2],win:0,hm:.8},
 Night:{sky:0x04050d,fog:0x0a1020,sun:0x6677ff,si:.3,d:[.2,.8,.3],win:1.4,hm:.25}};
const CH=200,ST=24,G=26,keys={};

// ---------- renderer / scene ----------
const R=new THREE.WebGLRenderer({antialias:true});R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(R.domElement);
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(80,1,.5,1500);sc.fog=new THREE.Fog(0,60,400);
const hemi=new THREE.HemisphereLight(0xaaccff,0x333344,.7),sun=new THREE.DirectionalLight(0xffffff,1),sunDir=V();
sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-160,right:160,top:160,bottom:-160,near:1,far:900});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0005;
sc.add(hemi,sun,sun.target);

// ---------- textures / materials ----------
function tex(lit){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle=lit?'#000':'#6b7686';x.fillRect(0,0,128,128);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=lit?(Math.random()<.45?(Math.random()<.7?'#ffd98a':'#8fe3ff'):'#000'):'#1d2733';x.fillRect(i*32+6,j*32+8,20,16)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
const facade=tex(0),glow=tex(1);
const roadM=new THREE.MeshStandardMaterial({color:0x1c1c22,roughness:.9}),lotM=new THREE.MeshStandardMaterial({color:0x4a4a55,roughness:.9}),
 waterM=new THREE.MeshStandardMaterial({color:0x0d3a5c,roughness:.15,metalness:.7}),parkM=new THREE.MeshStandardMaterial({color:0x2f6b3a,roughness:1}),
 deckM=new THREE.MeshStandardMaterial({color:0x888c96,roughness:.6});
const wmats=new Set();

// ---------- chunked city ----------
const chunks=new Map();
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mk(cx,cz){
 const r=rng(cx*73856093^cz*19349663),grp=new THREE.Group(),boxes=[],disp=[],ox=cx*CH,oz=cz*CH,water=Math.abs(cx)>4;
 const plane=(w,m,y)=>{const g=new THREE.PlaneGeometry(w,w),o=new THREE.Mesh(g,m);o.rotation.x=-Math.PI/2;o.position.set(ox,y,oz);o.receiveShadow=true;grp.add(o);disp.push(g)};
 const box=(x,z,w,h,d,y0,mat,bm)=>{const g=new THREE.BoxGeometry(w,h,d),o=new THREE.Mesh(g,mat);o.position.set(x,y0+h/2,z);o.castShadow=o.receiveShadow=true;grp.add(o);disp.push(g);
  boxes.push({x0:x-w/2,x1:x+w/2,y0,y1:y0+h,z0:z-d/2,z1:z+d/2});return o};
 const bld=(x,z,w,h,d,y0)=>{const m=new THREE.MeshStandardMaterial({map:facade.clone(),emissive:0xffffff,emissiveMap:glow,emissiveIntensity:TOD[S.tod].win,roughness:.35,metalness:.5,
   color:new THREE.Color().setHSL(.55+r()*.15,.2,.55+r()*.3)});m.map.needsUpdate=true;m.map.repeat.set(w/14,h/14);wmats.add(m);disp.push(m,m.map);box(x,z,w,h,d,y0,m)};
 if(water){plane(CH,waterM,-.4);
  if(cz===0){box(ox,oz,CH,1.5,30,10,deckM);for(const s of[-60,0,60])box(ox+s,oz,6,10,6,0,deckM)}
  else box(ox+30,oz+40,6,12,6,0,deckM)}
 else{plane(CH,roadM,0);plane(CH-ST,lotM,.06);
  const dt=Math.max(0,1-Math.hypot(cx,cz)/4);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){const x=ox+(i-1)*58.7,z=oz+(j-1)*58.7,w=26+r()*22,d=26+r()*22;
   if(r()<.08){box(x,z,w+8,.5,d+8,0,parkM);continue}
   const h=20+Math.pow(r(),2)*(120+dt*260);bld(x,z,w,h,d,0);if(h>150)bld(x,z,w*.6,h*.3,d*.6,h)}}
 grp.updateMatrixWorld(true);sc.add(grp);return{grp,boxes,disp}}
function drop(c){sc.remove(c.grp);c.disp.forEach(d=>{d.dispose();wmats.delete(d)})}
let pcx=1e9,pcz=1e9,dirty=true;
function stream(force){const q=Q[S.q],a=Math.round(P.pos.x/CH),b=Math.round(P.pos.z/CH);if(a===pcx&&b===pcz&&!dirty)return;pcx=a;pcz=b;dirty=false;
 for(let i=-q.rad;i<=q.rad;i++)for(let j=-q.rad;j<=q.rad;j++){const k=(a+i)+','+(b+j);if(!chunks.has(k))chunks.set(k,mk(a+i,b+j))}
 for(const[k,c]of chunks){const[x,z]=k.split(',').map(Number);if(Math.max(Math.abs(x-a),Math.abs(z-b))>q.rad){drop(c);chunks.delete(k)}}}
function nearBoxes(){const a=Math.round(P.pos.x/CH),b=Math.round(P.pos.z/CH),o=[];for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const c=chunks.get((a+i)+','+(b+j));if(c)o.push(...c.boxes)}return o}
function rayBox(o,d,b){let t0=0,t1=1e9;const mn=[b.x0,b.y0,b.z0],mx=[b.x1,b.y1,b.z1],oo=[o.x,o.y,o.z],dd=[d.x,d.y,d.z];
 for(let i=0;i<3;i++){if(Math.abs(dd[i])<1e-8){if(oo[i]<mn[i]||oo[i]>mx[i])return-1}else{let a=(mn[i]-oo[i])/dd[i],c=(mx[i]-oo[i])/dd[i];if(a>c)[a,c]=[c,a];t0=Math.max(t0,a);t1=Math.min(t1,c);if(t0>t1)return-1}}return t0}
function cast(o,d,max){let best=max;for(const b of nearBoxes()){const t=rayBox(o,d,b);if(t>=0&&t<best)best=t}return best<max?o.clone().addScaledVector(d,best):null}

// ---------- player ----------
const P={pos:V(100,3,100),vel:V(),ground:false,wall:null,rope:null,zip:null,zipT:0,want:false,cd:0,diving:false,rec:0,wasWR:false};
let yaw=Math.PI/4,pitch=-.15;
const camF=()=>V(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
const hero=new THREE.Group();hero.rotation.order='YXZ';sc.add(hero);
const red=new THREE.MeshStandardMaterial({color:0xc8102e,roughness:.35,metalness:.15}),blu=new THREE.MeshStandardMaterial({color:0x1b3a8f,roughness:.4}),wht=new THREE.MeshBasicMaterial({color:0xffffff});
function mesh(g,m,x,y,z,p){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;(p||hero).add(o);return o}
const torso=mesh(new THREE.CylinderGeometry(.32,.24,.95,14),red,0,.25,0);mesh(new THREE.CylinderGeometry(.25,.25,.3,14),blu,0,-.3,0);
mesh(new THREE.SphereGeometry(.23,14,12),red,0,.95,0);mesh(new THREE.BoxGeometry(.1,.06,.04),wht,-.1,.97,.2);mesh(new THREE.BoxGeometry(.1,.06,.04),wht,.1,.97,.2);
function limb(x,y,len,r,m){const p=new THREE.Group();p.position.set(x,y,0);hero.add(p);mesh(new THREE.CylinderGeometry(r,r*.8,len,10),m,0,-len/2,0,p);return p}
const armL=limb(-.42,.62,.75,.09,red),armR=limb(.42,.62,.75,.09,red),legL=limb(-.15,-.35,.85,.12,blu),legR=limb(.15,-.35,.85,.12,blu);
let hy=0,ph=0;
function pose(dt){const v=P.vel,sp=Math.hypot(v.x,v.y,v.z),h=Math.hypot(v.x,v.z);
 if(h>2){const t=Math.atan2(v.x,v.z),d=((t-hy+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;hy+=d*Math.min(1,10*dt)}
 ph+=h*dt*.7;let tilt=cl(h*.01,0,.4),aL=0,aR=0,lL=0,lR=0;
 if(P.ground){aL=Math.sin(ph)*h*.05;aR=-aL;lL=-aL*1.2;lR=aL*1.2;tilt=cl(h*.012,0,.35)}
 else if(P.wall&&keys.KeyW){tilt=-.1;aL=-2.7;aR=-2.7;lL=.3;lR=-.3}
 else if(P.diving){tilt=1.35;aL=aR=-.2;lL=lR=.15}
 else if(P.rope||P.zip){tilt=.5;aR=-2.7;aL=.6;lL=.7;lR=-.2}
 else{tilt=.3+cl(-v.y*.01,-.3,.5);aL=aR=-.8;lL=.4;lR=-.4}
 hero.position.copy(P.pos);hero.rotation.set(tilt,hy,0);
 const k=Math.min(1,12*dt);armL.rotation.x+=(aL-armL.rotation.x)*k;armR.rotation.x+=(aR-armR.rotation.x)*k;legL.rotation.x+=(lL-legL.rotation.x)*k;legR.rotation.x+=(lR-legR.rotation.x)*k;
 torso.scale.set(1+.03*Math.sin(clock*2)+.0,1+Math.min(.15,sp/500),1-Math.min(.1,sp/700));hero.updateMatrixWorld(true)}

// ---------- web lines ----------
const webs=[0,1].map(()=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:20},()=>V())),new THREE.LineBasicMaterial({color:0xffffff}));l.frustumCulled=false;l.visible=false;sc.add(l);return l});
function updWebs(dt){const a=P.rope?P.rope.pt:P.zip;P.rec*=Math.exp(-3*dt);
 webs.forEach((l,i)=>{l.visible=!!a;if(!a)return;const h=hero.localToWorld(V(i?.4:-.4,.7,.3)),d=a.clone().sub(h),perp=V(0,1,0).cross(d).normalize(),pos=l.geometry.attributes.position;
  for(let k=0;k<20;k++){const s=k/19,o=Math.sin(Math.PI*s)*Math.sin(clock*45+s*9+i)*P.rec*2.5,q=h.clone().addScaledVector(d,s).addScaledVector(perp,o);pos.setXYZ(k,q.x,q.y,q.z)}
  pos.needsUpdate=true;l.material.color.setHSL(.55,.6,.75+.25*(1-cl(P.vel.length()/90,0,1)))})}

// ---------- moves ----------
function findAnchor(){const fl=V(Math.sin(yaw),0,Math.cos(yaw)),rt=V(-Math.cos(yaw),0,Math.sin(yaw)),o=P.pos.clone();
 const tries=S.assist?[[.9,0],[1.3,0],[.9,-.5],[.9,.5],[.6,0],[2,0],[1.3,-.7],[1.3,.7]]:[[.7,0]];
 for(const[u,s]of tries){const d=S.assist?fl.clone().addScaledVector(rt,s).setY(u).normalize():camF().add(V(0,u,0)).normalize();
  const h=cast(o,d,170);if(h&&h.distanceTo(o)>8&&h.y>P.pos.y+3)return h}return null}
function attach(){const h=findAnchor();if(!h)return;P.rope={pt:h};P.len=h.distanceTo(P.pos);P.rec=1;thwip()}
function zip(){const h=findAnchor();if(!h)return;P.rope=null;P.zip=h;P.zipT=1.5;P.rec=1;thwip()}
function release(){if(P.rope){P.rope=null;P.vel.multiplyScalar(1.06);P.vel.y+=3}}
function step(dt){const p=P.pos,v=P.vel,fl=V(Math.sin(yaw),0,Math.cos(yaw)),rt=V(-Math.cos(yaw),0,Math.sin(yaw));
 const wish=fl.clone().multiplyScalar((keys.KeyW?1:0)-(keys.KeyS?1:0)).addScaledVector(rt,(keys.KeyD?1:0)-(keys.KeyA?1:0));if(wish.lengthSq()>1)wish.normalize();
 P.diving=!!keys[K.dive]&&!P.ground&&!P.rope&&!P.zip;
 if(P.want&&!P.rope&&!P.zip&&!P.ground){P.cd-=dt;if(P.cd<=0){P.cd=.12;attach()}}
 const wr=!!P.wall&&keys.KeyW&&!P.ground&&!P.rope&&!P.zip;
 if(P.wasWR&&!wr&&!P.wall&&!P.ground){v.y+=8;v.addScaledVector(fl,8)}P.wasWR=wr;
 if(P.zip){const d=P.zip.clone().sub(p),L=d.length();if(L<7||P.zipT<0){P.zip=null;v.y+=10}else{v.lerp(d.multiplyScalar(80/L),Math.min(1,12*dt));P.zipT-=dt}}
 else{
  if(wr){v.y+=(15-v.y)*Math.min(1,6*dt);v.addScaledVector(P.wall,-8*dt)}else v.y-=G*(P.diving?1.6:1)*dt;
  if(P.ground&&!P.rope){const k=Math.min(1,8*dt);v.x+=(wish.x*14-v.x)*k;v.z+=(wish.z*14-v.z)*k}else v.addScaledVector(wish,(P.rope?16:7)*dt);
  if(P.diving){v.addScaledVector(camF(),50*dt)}
  if(P.rope&&keys.KeyW)P.len=Math.max(14,P.len-8*dt);
  const sp=v.length();if(sp>140)v.multiplyScalar(140/sp)}
 p.addScaledVector(v,dt);
 if(P.rope){const d=p.clone().sub(P.rope.pt),L=d.length();if(L>P.len){const n=d.divideScalar(L);p.copy(P.rope.pt).addScaledVector(n,P.len);const rd=v.dot(n);if(rd>0)v.addScaledVector(n,-rd)}}
 collide(nearBoxes())}
function collide(B){P.ground=false;P.wall=null;const p=P.pos,v=P.vel;if(p.y<1){p.y=1;if(v.y<0)v.y=0;P.ground=true}
 for(const b of B){const dx=p.x-cl(p.x,b.x0,b.x1),dy=p.y-cl(p.y,b.y0,b.y1),dz=p.z-cl(p.z,b.z0,b.z1),d2=dx*dx+dy*dy+dz*dz;if(d2>=1)continue;
  let n;if(d2<1e-8){n=V(0,1,0);p.y=b.y1+1}else{const d=Math.sqrt(d2);n=V(dx/d,dy/d,dz/d);p.addScaledVector(n,1-d)}
  const vn=v.dot(n);if(vn<0)v.addScaledVector(n,-vn);if(n.y>.6)P.ground=true;else if(Math.abs(n.y)<.4)P.wall=n}}

// ---------- traffic ----------
const NC=70,carMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffeeaa,emissiveIntensity:2});
const carMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(2.2,1.3,4.6),new THREE.MeshStandardMaterial({roughness:.3,metalness:.6}),NC),
 lightMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1.9,.25,.15),carMat,NC);carMesh.frustumCulled=lightMesh.frustumCulled=false;carMesh.castShadow=true;sc.add(carMesh,lightMesh);
const cars=[],dm=new THREE.Object3D();
function respawn(c,init){const q=c.ax?P.pos.z:P.pos.x;c.pos=q-c.dir*(init?(Math.random()-.5)*700:320);c.lane=Math.round((c.ax?P.pos.x:P.pos.z)/CH)+((Math.random()*3|0)-1)}
for(let i=0;i<NC;i++){const c={ax:i&1,dir:i&2?1:-1,sp:8+Math.random()*10};respawn(c,true);cars.push(c);carMesh.setColorAt(i,new THREE.Color().setHSL(Math.random(),.6,.5))}
function updCars(dt){cars.forEach((c,i)=>{c.pos+=c.dir*c.sp*dt;if(Math.abs(c.pos-(c.ax?P.pos.z:P.pos.x))>360)respawn(c);
 const o=c.lane*CH+c.dir*5,x=c.ax?o:c.pos,z=c.ax?c.pos:o,ry=c.ax?(c.dir>0?0:Math.PI):(c.dir>0?Math.PI/2:-Math.PI/2),y=Math.abs(x)>4.5*CH?-50:.7;
 dm.position.set(x,y,z);dm.rotation.set(0,ry,0);dm.updateMatrix();carMesh.setMatrixAt(i,dm.matrix);
 dm.position.set(x+Math.sin(ry)*2.3,y+.2,z+Math.cos(ry)*2.3);dm.updateMatrix();lightMesh.setMatrixAt(i,dm.matrix)});
 carMesh.instanceMatrix.needsUpdate=lightMesh.instanceMatrix.needsUpdate=true;if(carMesh.instanceColor)carMesh.instanceColor.needsUpdate=true}

// ---------- audio ----------
let AC,wg;
function audio(){if(AC)return;AC=new AudioContext();const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const s=AC.createBufferSource();s.buffer=b;s.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=700;wg=AC.createGain();wg.gain.value=0;s.connect(f).connect(wg).connect(AC.destination);s.start()}
function thwip(){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type='sawtooth';o.frequency.setValueAtTime(1400,t);o.frequency.exponentialRampToValueAtTime(250,t+.14);
 g.gain.setValueAtTime(.12*S.sfx*S.vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g).connect(AC.destination);o.start();o.stop(t+.2)}

// ---------- settings / UI ----------
function applyQ(){const q=Q[S.q];R.setPixelRatio(Math.min(devicePixelRatio,q.pr));R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();
 R.shadowMap.enabled=q.sh>0;if(q.sh){sun.shadow.mapSize.set(q.sh,q.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
 sc.fog.far=(q.rad+.6)*CH;sc.traverse(o=>{if(o.material)o.material.needsUpdate=true});dirty=true}
function applyTOD(){const t=TOD[S.tod];sc.background=new THREE.Color(t.sky);sc.fog.color.set(t.fog);sun.color.set(t.sun);sun.intensity=t.si;hemi.intensity=t.hm;sunDir.set(...t.d).normalize();
 wmats.forEach(m=>m.emissiveIntensity=t.win);carMat.emissiveIntensity=S.tod==='Night'?3:.6}
function applyHUD(){$('hud').style.display=S.vel?'block':'none';$('mm').style.display=S.map?'block':'none';$('b1').style.display=$('b2').style.display=S.bars?'block':'none';
 if(!S.lines)fx.clearRect(0,0,fxc.width,fxc.height)}
const bindUI=(id,k,t)=>{const e=$(id);e.oninput=e.onchange=()=>{S[k]=t==='b'?e.checked:t==='n'?+e.value:e.value;if(k==='q')applyQ();else if(k==='tod')applyTOD();else applyHUD()}};
[['q','q','s'],['tod','tod','s'],['fov','fov','n'],['lag','lag','n'],['assist','assist','b'],['vol','vol','n'],['sfx','sfx','n'],['vel','vel','b'],['map','map','b'],['lines','lines','b'],['bars','bars','b']].forEach(a=>bindUI(...a));
let rebind=null;for(const k in K){const b=$('kb_'+k);b.textContent=K[k];b.onclick=()=>{rebind=k;b.textContent='press a key…'}}
let paused=true;$('go').onclick=()=>{audio();if(AC&&AC.state==='suspended')AC.resume();document.body.requestPointerLock()};
document.addEventListener('pointerlockchange',()=>{paused=document.pointerLockElement==null;$('menu').style.display=paused?'flex':'none';if(paused)for(const k in keys)keys[k]=false});
addEventListener('mousemove',e=>{if(paused)return;yaw-=e.movementX*.0025;pitch=cl(pitch-e.movementY*.0025,-1.4,1.4)});
addEventListener('keydown',e=>{if(rebind){if(e.code!=='Escape'){K[rebind]=e.code;}$('kb_'+rebind).textContent=K[rebind];rebind=null;e.preventDefault();return}
 if(paused||e.repeat)return;keys[e.code]=true;if(e.code==='Space')e.preventDefault();
 if(e.code===K.swing)start();if(e.code===K.zip)zip()});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code===K.swing)stop()});
addEventListener('mousedown',e=>{if(!paused&&e.button===0)start()});addEventListener('mouseup',e=>{if(e.button===0)stop()});
function start(){P.want=true;if(P.ground){P.vel.y=15;P.ground=false}else attach()}
function stop(){P.want=false;release()}
addEventListener('resize',()=>{applyQ();fxc.width=innerWidth;fxc.height=innerHeight});

// ---------- fx / minimap / hud ----------
const fxc=$('fx'),fx=fxc.getContext('2d'),mm=$('mm').getContext('2d');fxc.width=innerWidth;fxc.height=innerHeight;
function speedLines(sp){fx.clearRect(0,0,fxc.width,fxc.height);if(!S.lines||sp<45)return;const cx=fxc.width/2,cy=fxc.height/2,D=Math.hypot(cx,cy),a=cl((sp-45)/80,0,.6);
 fx.strokeStyle='rgba(255,255,255,'+a+')';fx.lineWidth=1.5;fx.beginPath();for(let i=0;i<40;i++){const t=Math.random()*6.283,r1=D*(.4+Math.random()*.3),r2=r1+D*(.15+Math.random()*.25);fx.moveTo(cx+Math.cos(t)*r1,cy+Math.sin(t)*r1);fx.lineTo(cx+Math.cos(t)*r2,cy+Math.sin(t)*r2)}fx.stroke()}
function minimap(){if(!S.map)return;mm.clearRect(0,0,150,150);mm.fillStyle='#0b1220';mm.fillRect(0,0,150,150);const s=.3;
 for(const c of chunks.values())for(const b of c.boxes){const x=75+(b.x0-P.pos.x)*s,y=75+(b.z0-P.pos.z)*s,w=(b.x1-b.x0)*s,h=(b.z1-b.z0)*s;if(x>150||y>150||x+w<0||y+h<0)continue;mm.fillStyle='hsl(215,25%,'+(20+Math.min(40,b.y1/5))+'%)';mm.fillRect(x,y,w,h)}
 mm.save();mm.translate(75,75);mm.rotate(Math.PI-yaw);mm.fillStyle='#e6233a';mm.beginPath();mm.moveTo(0,-8);mm.lineTo(5,6);mm.lineTo(-5,6);mm.fill();mm.restore()}

// ---------- main loop ----------
let last=performance.now(),clock=0,fr=0;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000);last=now;
 if(!paused){clock+=dt;stream();step(dt/2);step(dt/2);updCars(dt)}
 pose(dt);updWebs(dt);
 const sp=P.vel.length(),dist=9+Math.min(6,sp*.05),tgt=P.pos.clone().addScaledVector(camF(),-dist);tgt.y=Math.max(tgt.y+2.5,1.5);
 cam.position.lerp(tgt,1-Math.exp(-dt*(30-26*S.lag)));cam.lookAt(P.pos.x,P.pos.y+1,P.pos.z);
 cam.fov+=(S.fov+Math.min(28,sp*.22)-cam.fov)*Math.min(1,4*dt);cam.updateProjectionMatrix();
 sun.position.copy(P.pos).addScaledVector(sunDir,400);sun.target.position.copy(P.pos);
 if(wg)wg.gain.value=S.vol*Math.min(1,sp/90)*.5;
 if(fr++%2===0){speedLines(sp);if(fr%6===0)minimap()}
 $('hud').innerHTML=Math.round(sp*3.6)+' km/h<small>ALT '+Math.round(P.pos.y)+' m · '+(P.zip?'ZIP':P.rope?'SWING':P.wall&&keys.KeyW?'WALL-RUN':P.diving?'DIVE':P.ground?'GROUND':'AIR')+'</small>';
 R.render(sc,cam)}
applyQ();applyTOD();applyHUD();stream();requestAnimationFrame(loop);
