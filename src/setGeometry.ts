import * as T from 'three';
import type {SceneObject} from './model.ts';
// Reusable, editable previs stand-ins. Every asset is generated from dimensions.
export function buildSubject(o:SceneObject):T.Group{
 const g=new T.Group();g.position.fromArray(o.position);g.rotation.y=o.rotation;g.userData.objectId=o.id;
 const [w,h,d]=o.size;
 function part(geometry:T.BufferGeometry,color:string,position:[number,number,number],scale?:[number,number,number]){const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.7}));m.position.fromArray(position);if(scale)m.scale.fromArray(scale);m.castShadow=m.receiveShadow=true;m.userData.objectId=o.id;g.add(m);return m;}
 if(o.kind==='flower'){
  const headY=Math.max(h*.5,h-w*.46),stem=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(-w*.025,headY*.5,0),new T.Vector3(0,headY,0)]);
  part(new T.TubeGeometry(stem,18,Math.min(w*.023,h*.015),8,false),'#506c26',[0,0,0]);
  const head=new T.Group();head.userData.facingHead=true;head.position.y=headY;head.rotation.set(o.orientation?.[0]??.2,o.orientation?.[1]??0,o.orientation?.[2]??0,'YXZ');g.add(head);
  const move=(m:T.Mesh)=>{g.remove(m);head.add(m);};
  for(let layer=0;layer<2;layer++)for(let i=0;i<20;i++){const a=i*Math.PI/10+layer*.14,r=w*(layer?.25:.29);const petal=part(new T.SphereGeometry(1,12,8),o.color,[Math.sin(a)*r,Math.cos(a)*r,layer*.035*w],[w*.065,w*.225,w*.025]);petal.rotation.z=-a;petal.rotation.x=Math.sin(i*2.7)*.09;move(petal);}
  const centre=part(new T.SphereGeometry(1,24,12),'#b88b20',[0,0,w*.065],[w*.17,w*.17,w*.07]);move(centre);
  const leaf=part(new T.SphereGeometry(1,12,8),'#536d2b',[w*.1,headY*.24,0],[w*.045,headY*.19,w*.015]);leaf.rotation.z=-.5;
 }else if(o.kind==='car'){
  part(new T.SphereGeometry(1,32,16),o.color,[0,h*.43,0],[w*.5,h*.31,d*.48]);
  part(new T.BoxGeometry(w*.75,h*.2,d*.86),o.color,[0,h*.35,0]);
  const cabin=new T.Shape();cabin.moveTo(-w*.32,h*.48);cabin.bezierCurveTo(-w*.25,h*.62,-w*.2,h*.94,-w*.07,h*.96);cabin.bezierCurveTo(w*.08,h,w*.15,h*.82,w*.24,h*.5);cabin.lineTo(-w*.32,h*.48);
  const shell=part(new T.ExtrudeGeometry(cabin,{depth:d*.72,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1,curveSegments:12}),o.color,[0,0,-d*.36]);
  shell.geometry.computeVertexNormals();
  for(const z of [-1,1]){
   const window=part(new T.SphereGeometry(1,20,12),'#62747a',[-w*.015,h*.73,z*d*.368],[w*.205,h*.185,d*.025]);
   (window.material as T.MeshStandardMaterial).roughness=.25;(window.material as T.MeshStandardMaterial).metalness=.25;
   part(new T.BoxGeometry(w*.018,h*.34,d*.015),o.color,[w*.005,h*.73,z*d*.392]);
   part(new T.BoxGeometry(w*.065,h*.025,d*.025),'#b5c0be',[0,h*.45,z*d*.48]);
   for(const x of [-1,1]){
    const wheel=part(new T.CylinderGeometry(h*.235,h*.235,d*.12,24),'#252b2b',[x*w*.305,h*.235,z*d*.44]);wheel.rotation.x=Math.PI/2;
    const hub=part(new T.CylinderGeometry(h*.15,h*.15,d*.125,20),'#9da9a7',[x*w*.305,h*.235,z*d*.45]);hub.rotation.x=Math.PI/2;
   }
  }
  for(const z of [-1,1]){part(new T.SphereGeometry(1,16,10),'#dbe4d9',[w*.40,h*.49,z*d*.25],[w*.025,h*.12,d*.075]);part(new T.BoxGeometry(w*.035,h*.065,d*.88),'#9caaa9',[w*.49,h*.25,0]);}
 }else if(o.kind==='person'){
  part(new T.CapsuleGeometry(w*.34,h*.37,6,12),o.color,[0,h*.53,0]);const head=new T.Group();head.userData.facingHead=true;head.position.y=h*.91;head.rotation.set(o.look?.[0]??0,o.look?.[1]??0,0,'YXZ');g.add(head);for(const [geometry,position] of [[new T.SphereGeometry(w*.28,20,14),[0,0,0]],[new T.SphereGeometry(w*.075,12,8),[0,0,w*.28]]] as [T.BufferGeometry,[number,number,number]][]){const m=part(geometry,o.color,position);g.remove(m);head.add(m);}for(const x of [-1,1])part(new T.CapsuleGeometry(w*.13,h*.28,4,10),o.color,[x*w*.2,h*.22,0]);
 }else if(o.kind==='cylinder'){
  part(new T.CylinderGeometry(.5,.5,1,24),o.color,[0,0,0],[w,h,d]);
 }else{
  part(o.kind==='sphere'?new T.SphereGeometry(.5,24,16):new T.BoxGeometry(1,1,1),o.color,[0,0,0],[w,h,d]);
  if(o.name.toLowerCase().includes('table'))for(const x of [-1,1])for(const z of [-1,1])part(new T.BoxGeometry(.07,Math.max(.1,o.position[1]-h/2),.07),o.color,[x*(w/2-.1),-(o.position[1]+h/2)/2,z*(d/2-.1)]);
 }
 if(o.kind!=='flower'&&o.orientation){g.rotation.x=o.orientation[0];g.rotation.y+=o.orientation[1];g.rotation.z=o.orientation[2];}
 return g;
}
export function rollingGround(w:number,d:number,objects:SceneObject[]=[]):T.BufferGeometry{
 const geometry=new T.PlaneGeometry(w,d,64,64);geometry.rotateX(-Math.PI/2);const a=geometry.attributes.position;
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);const distance=objects.length?Math.min(...objects.map(o=>Math.hypot(x-o.position[0],z-o.position[2]))):Math.hypot(x,z);const blend=T.MathUtils.smoothstep(distance,5,14);a.setY(i,(Math.sin(x*.18+z*.12)*1.5+Math.cos(z*.2)*.8)*blend);}
 geometry.computeVertexNormals();return geometry;
}
