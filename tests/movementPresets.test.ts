import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Quaternion,Vector3} from 'three';
import {createMovement,mainSubject} from '../src/movementPresets.ts';
import {movementPresets} from '../src/movementCatalogue.ts';
import {newProject,parseProject,sampleTake,trajectory} from '../src/model.ts';
import type {Pose} from '../src/model.ts';
const seed:Pose={t:0,position:[4,2,7],quaternion:[0,0,0,1],focal:35,aperture:2.8,focus:7};
const preset=(id:string)=>movementPresets.find(p=>p.id===id)!;
test('the 34 current library movements plus five additions produce real round-trippable takes',()=>{
 const p=newProject(),before=structuredClone(p);assert.equal(movementPresets.filter(p=>p.id.startsWith('shot-')).length,34);
 for(const m of movementPresets){if(m.unavailable){assert.throws(()=>createMovement(p,m,seed,{duration:3,amount:1}),/Needs/);continue;}
 const t=createMovement(p,m,seed,{duration:3,amount:1});assert.equal(t.samples.length,181,m.title);assert.equal(t.samples[0].t,0);assert.equal(t.samples.at(-1)!.t,3);assert.deepEqual(parseProject({...p,takes:[t]}).takes[0],t);assert.equal(trajectory(t).samples.length,91);}
 assert.deepEqual(p,before);
});
test('dolly zoom changes lens and translation while holding target projection across the whole take',()=>{
 const p=newProject(),hero=mainSubject(p)!,target=new Vector3(...hero.position).add(new Vector3(0,hero.size[1]*.5,0));
 for(const id of ['dolly-zoom-in','dolly-zoom-out']){const t=createMovement(p,preset(id),seed,{duration:4,amount:1});const sizes:number[]=[];for(let i=0;i<=80;i++){const s=sampleTake(t,i/20),c=new PerspectiveCamera();c.aspect=16/9;c.setFocalLength(s.focal);c.position.fromArray(s.position);c.quaternion.fromArray(s.quaternion);c.updateMatrixWorld();const a=target.clone().project(c),b=target.clone().add(new Vector3(0,.01,0)).project(c);sizes.push(b.y-a.y);}assert.ok(Math.max(...sizes)-Math.min(...sizes)<1e-5);assert.notEqual(t.samples[0].focal,t.samples.at(-1)!.focal);assert.notDeepEqual(t.samples[0].position,t.samples.at(-1)!.position);}
});
test('orbit makes a full circle with constant radius; zoom has no physical travel; dolly preserves lens',()=>{
 const p=newProject(),hero=mainSubject(p)!,target=new Vector3(...hero.position).add(new Vector3(0,hero.size[1]*.5,0));
 const orbit=createMovement(p,preset('shot-15'),seed,{duration:4,amount:1});const radius=new Vector3(...orbit.samples[0].position).distanceTo(target);for(const s of orbit.samples)assert.ok(Math.abs(new Vector3(...s.position).distanceTo(target)-radius)<1e-8);assert.ok(new Vector3(...orbit.samples[0].position).distanceTo(new Vector3(...orbit.samples.at(-1)!.position))<1e-8);assert.ok(new Vector3(...sampleTake(orbit,2).position).distanceTo(new Vector3(...orbit.samples[0].position))>radius);
 const zoom=createMovement(p,preset('shot-05'),seed,{duration:4,amount:1});assert.ok(zoom.samples.every(s=>JSON.stringify(s.position)===JSON.stringify(zoom.samples[0].position)));assert.ok(zoom.samples.at(-1)!.focal>zoom.samples[0].focal);
 const dolly=createMovement(p,preset('shot-08'),seed,{duration:4,amount:1});assert.ok(dolly.samples.every(s=>s.focal===dolly.samples[0].focal));
});
test('custom travelling endpoints preserve exact camera/lens and explicit focus subjects reach their targets',()=>{
 const p=newProject(),start={...seed,position:[4,2,7] as [number,number,number]},end={...seed,position:[2,2,3] as [number,number,number],focal:70,focus:3};
 const t=createMovement(p,preset('shot-12'),seed,{duration:3,amount:1,start,end});assert.deepEqual(t.samples[0],start);const last=t.samples.at(-1)!;assert.deepEqual(last.position,end.position);assert.equal(last.focal,70);assert.equal(last.focus,3);
 const focus=createMovement(p,preset('rack-focus'),seed,{duration:3,amount:1,startTarget:p.objects[0].id,endTarget:p.objects[2].id});const endPose=focus.samples.at(-1)!,o=p.objects[2],point=new Vector3(...o.position),direction=point.sub(new Vector3(...endPose.position));assert.ok(endPose.focus>0);assert.deepEqual(focus.samples[0].quaternion,endPose.quaternion);assert.notEqual(focus.samples[0].focus,endPose.focus);
 const aimed=createMovement(p,preset('shot-08'),seed,{duration:3,amount:1,startTarget:p.objects[1].id,endTarget:p.objects[2].id});const s=aimed.samples.at(-1)!,forward=new Vector3(0,0,-1).applyQuaternion(new Quaternion(...s.quaternion));assert.ok(forward.dot(new Vector3(...o.position).sub(new Vector3(...s.position)).normalize())>.999999);
 assert.ok(direction.length()>0);
});
test('bad inputs fail without changing the project',()=>{
 const p=newProject(),before=structuredClone(p);assert.throws(()=>createMovement(p,preset('shot-08'),seed,{duration:NaN,amount:1}),/duration/);assert.throws(()=>createMovement(p,preset('shot-08'),seed,{duration:4,amount:1,startTarget:'missing'}),/missing/);assert.deepEqual(p,before);
});

test('fixed-position presets adapt carried-over end captures instead of failing after generation',()=>{
 const p=newProject(),end={...seed,position:[8,4,2] as [number,number,number],quaternion:new Quaternion().setFromAxisAngle(new Vector3(0,1,0),.7).toArray() as Pose['quaternion'],focal:85};
 for(const id of ['shot-01','shot-02','shot-04','shot-05','rack-focus']){const t=createMovement(p,preset(id),seed,{duration:2,amount:1,start:seed,end});assert.ok(t.samples.every(s=>JSON.stringify(s.position)===JSON.stringify(seed.position)),id);if(id==='shot-05')assert.equal(t.samples.at(-1)!.focal,85);else assert.ok(t.samples.every(s=>s.focal===seed.focal));}
 const pan=createMovement(p,preset('shot-02'),seed,{duration:2,amount:1,start:seed,end});assert.ok(Math.abs(pan.samples.at(-1)!.quaternion[1]-end.quaternion[1])<1e-9);
});
test('manual start composition is preserved when an object is selected for focus',()=>{
 const p=newProject(),t=createMovement(p,preset('shot-14'),seed,{duration:2,amount:1,start:seed,startTarget:p.objects[1].id});assert.deepEqual(t.samples[0].position,seed.position);assert.ok(new Quaternion(...t.samples[0].quaternion).angleTo(new Quaternion(...seed.quaternion))<1e-7);
});
test('custom dolly-zoom endpoints coordinate the lens automatically rather than requiring manual mm matching',()=>{
 const p=newProject(),automatic=createMovement(p,preset('dolly-zoom-in'),seed,{duration:2,amount:1}),start=automatic.samples[0],end={...automatic.samples.at(-1)!,focal:135};const t=createMovement(p,preset('dolly-zoom-in'),seed,{duration:2,amount:1,start,end,startTarget:p.objects[1].id,endTarget:p.objects[0].id});assert.ok(Math.abs(t.samples.at(-1)!.focal-automatic.samples.at(-1)!.focal)<1e-7);assert.deepEqual(t.samples.at(-1)!.position,end.position);
});
