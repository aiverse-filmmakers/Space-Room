import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Quaternion,Vector3} from 'three';
import {newProject,parseProject} from '../src/model.ts';
import {compassShots} from '../src/shotPlanner.ts';
import {fitReferenceSet} from '../src/framing.ts';
import {cameraInsideRoom,createViewWorld,disposeViewWorld,inspectView,reviewOverview,updateRoomCutaway} from '../src/viewQuality.ts';
function camera(position:Vector3,target:Vector3,focal=35){const c=new PerspectiveCamera(50,16/9,.05,300);c.position.copy(position);c.lookAt(target);c.setFocalLength(focal);c.updateMatrixWorld();return c;}
test('visibility check reproduces the opaque exterior wall and cutaway exposes real subjects',()=>{
 const p=newProject(),world=createViewWorld(p),c=camera(new Vector3(0,1.5,-15),new Vector3(0,1,-1));
 try{assert.equal(inspectView(world,c).visibleSubjects,0);assert.deepEqual(updateRoomCutaway(world,p.room,c.position),['north']);assert.ok(inspectView(world,c).visibleSubjects>0);updateRoomCutaway(world,p.room,new Vector3(0,1,0));assert.equal(inspectView(world,c).visibleSubjects,0,'wall is restored when the camera returns inside');}finally{disposeViewWorld(world);}
});
test('four generated interior views pass real mesh visibility, prefer inside cameras and round-trip checks',()=>{
 const p=newProject(),before=structuredClone(p),cards=compassShots(p);assert.equal(cards.length,4);assert.ok(cards.every(c=>c.viewQuality.status==='clear'));assert.ok(cards.every(c=>c.viewQuality.visibleSubjects>0));assert.ok(cards.some(c=>cameraInsideRoom(p.room,c.pose)));
 const world=createViewWorld(p);try{for(const card of cards){const report=reviewOverview(world,p,card.pose,16/9);assert.equal(report.status,'clear',card.title);}}finally{disposeViewWorld(world);}
 assert.deepEqual(p,before);const saved=parseProject({...p,compass:cards});assert.deepEqual(saved.compass?.map(c=>c.viewQuality),cards.map(c=>c.viewQuality));
});
test('portrait and tight-room overviews use checked cutaways when an inside camera cannot fit',()=>{
 const p=newProject();p.room=[4,3,4];p.frameFormat='9:16';const cards=compassShots(p);assert.ok(cards.every(c=>c.viewQuality.status==='clear'));assert.ok(cards.some(c=>c.viewQuality.cutaway));
 const changed=structuredClone(p);changed.compass=cards;changed.compass![0].viewQuality!.visibleSubjects=-1;assert.throws(()=>parseProject(changed),/view quality/);
});
test('checker distinguishes an empty or misdirected camera from a clear frame without using pixel colour',()=>{
 const p=newProject(),world=createViewWorld(p);try{const away=camera(new Vector3(0,2,5),new Vector3(0,2,20));assert.equal(inspectView(world,away).status,'needs-review');const empty=createViewWorld({...p,objects:[]});try{assert.equal(inspectView(empty,away).totalSubjects,0);}finally{disposeViewWorld(empty);}}finally{disposeViewWorld(world);}
});
test('exterior sets have no shell cutaway and saved outside cameras retain poses while walls are cleared',()=>{
 const p=newProject();p.environment={kind:'exterior',sky:'#aabbcc',ground:'#889966',terrain:'flat'};assert.ok(compassShots(p).every(c=>!c.viewQuality.cutaway&&c.viewQuality.status==='clear'));
 const interior=newProject(),pose=fitReferenceSet(interior.objects,{position:[20,2,0],target:[0,1,-1],focal:35}),copy=structuredClone(pose),world=createViewWorld(interior);try{assert.equal(reviewOverview(world,interior,pose,16/9).status,'clear');assert.deepEqual(pose,copy);const forward=new Vector3(0,0,-1).applyQuaternion(new Quaternion(...pose.quaternion));assert.ok(forward.x<0);}finally{disposeViewWorld(world);}
});
test('large exterior overview cameras validate beyond the old fixed 300 metre far plane',()=>{
 const p=newProject();p.environment={kind:'exterior',sky:'#aabbcc',ground:'#889966',terrain:'flat'};p.room=[1000,50,1000];p.objects=[{id:'a',name:'Left',kind:'box',position:[-350,5,0],size:[10,10,10],rotation:0,color:'#aaaaaa'},{id:'b',name:'Right',kind:'box',position:[350,5,0],size:[10,10,10],rotation:0,color:'#bbbbbb'}];const cards=compassShots(p);assert.ok(cards.some(c=>Math.hypot(...c.pose.position)>300));assert.ok(cards.every(c=>c.viewQuality.status==='clear'));
});
