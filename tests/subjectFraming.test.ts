import {test} from 'node:test';import assert from 'node:assert/strict';import {PerspectiveCamera,Box3,Vector3,Mesh} from 'three';
import {subjectFraming} from '../src/subjectFraming.ts';import {buildSubject} from '../src/setGeometry.ts';import type {Pose,SceneObject} from '../src/model.ts';
const current:Pose={t:0,position:[3,2,8],quaternion:[0,0,0,1],focal:35,focus:8,aperture:2.8};
function cam(p:Pose){const c=new PerspectiveCamera(50,16/9,.05,5000);c.filmGauge=36;c.setFocalLength(p.focal);c.position.fromArray(p.position);c.quaternion.fromArray(p.quaternion);c.updateMatrixWorld();return c;}
test('wide and medium fit real subject geometry across sizes and rotations',()=>{
 for(const kind of ['person','flower','car'] as const)for(const scale of [.5,1,4]){
  const object:SceneObject={id:'subject',name:kind,kind,position:[1,0,-2],size:(kind==='person'?[.5,1.8,.5]:kind==='flower'?[3,5,3]:[4.3,1.35,1.7]).map(v=>v*scale) as [number,number,number],rotation:.8,color:'#ffffff'};
  const g=buildSubject(object);g.updateMatrixWorld(true);const b=new Box3().setFromObject(g,true);
  for(const preset of ['Wide','Medium'] as const){const p=subjectFraming(object,preset,current),c=cam(p);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const clip=new Vector3(x,y,z).project(c);assert.ok(Math.abs(clip.x)<1&&Math.abs(clip.y)<1&&clip.z<1,`${kind} ${scale} ${preset} is clipped`);}}
  g.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});
 }
});
test('flower close-up targets the head and over-shoulder follows the person facing',()=>{
 const flower:SceneObject={id:'flower',name:'Flower',kind:'flower',position:[0,0,0],size:[3,5,3],rotation:0,color:'#ffffff'};const p=subjectFraming(flower,'Close up',current),head=new Vector3(0,5-3*.46,0).project(cam(p));assert.ok(Math.abs(head.x)<1e-9&&Math.abs(head.y)<1e-9);assert.equal(p.focal,85);assert.throws(()=>subjectFraming(flower,'Over shoulder',current),/person/);
 const person:SceneObject={...flower,kind:'person',size:[.5,1.8,.5],rotation:Math.PI/2},ots=subjectFraming(person,'Over shoulder',current);assert.ok(ots.position[0]<0);assert.equal(ots.focal,50);
});
