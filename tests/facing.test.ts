import {test} from 'node:test';import assert from 'node:assert/strict';import {Vector3} from 'three';
import {hasFacing,turnFacing,facingVector,facingAnchor,facingArrow,facingDescription} from '../src/facing.ts';import {buildSubject} from '../src/setGeometry.ts';import {newProject,parseProject} from '../src/model.ts';import type {SceneObject} from '../src/model.ts';import {imagePayload} from '../generation.mjs';
const person:SceneObject={id:'person',name:'Actor',kind:'person',position:[0,0,0],size:[.5,1.8,.5],rotation:0,color:'#cccccc'};
const close=(a:Vector3,b:Vector3)=>assert.ok(a.distanceTo(b)<1e-7,`${a.toArray()} != ${b.toArray()}`);
test('person facing turns only the head, remains aligned with arrow through body rotation, and persists',()=>{
 const edited={...person,...turnFacing(person,Math.PI/2,.2)};assert.equal(edited.rotation,0);assert.deepEqual(edited.look,[.2,Math.PI/2]);const mesh=buildSubject(edited);mesh.updateMatrixWorld(true);const head=mesh.children.find(c=>c.userData.facingHead)!;close(new Vector3(0,0,1).transformDirection(head.matrixWorld),facingVector(edited));close(head.getWorldPosition(new Vector3()),facingAnchor(edited));
 const p=newProject();p.objects=[edited];p.facingGuides=false;assert.deepEqual(parseProject(JSON.parse(JSON.stringify(p))).objects[0].look,edited.look);assert.equal(parseProject(p).facingGuides,false);assert.throws(()=>parseProject({...p,objects:[{...edited,look:[0,99]}]}),/head direction/);
});
test('car arrow follows its real front and flower arrow follows the tilted head without moving the stem',()=>{
 const car={...person,kind:'car' as const,size:[4,1.4,1.8] as [number,number,number]};close(facingVector(car),new Vector3(1,0,0));const turned={...car,...turnFacing(car,Math.PI/2)};close(facingVector(turned),new Vector3(0,0,-1));assert.deepEqual(turned.position,car.position);
 const flower={...person,kind:'flower' as const,size:[2,5,2] as [number,number,number],rotation:.4};const edited={...flower,...turnFacing(flower,.7,-.4)},g=buildSubject(edited);g.updateMatrixWorld(true);const head=g.children.find(c=>c.userData.facingHead)!;close(new Vector3(0,0,1).transformDirection(head.matrixWorld),facingVector(edited));close(head.getWorldPosition(new Vector3()),facingAnchor(edited));assert.deepEqual(edited.position,flower.position);assert.equal(edited.rotation,flower.rotation);
 assert.equal(hasFacing({...person,kind:'box'}),false);assert.equal(hasFacing(person),true);
});
test('mockup facing guides are annotation-only and prompt directions follow the selected camera',()=>{
 const g=facingArrow(person,false);assert.equal(g.name,'facing:person');assert.equal(g.children.length,1);assert.equal(facingArrow(person,true).children.length,2);
 const pose={t:0,position:[0,1,5] as [number,number,number],quaternion:[0,0,0,1] as [number,number,number,number],focal:35,aperture:2.8,focus:5};assert.match(facingDescription([person],pose),/toward the viewer/);assert.match(facingDescription([{...person,...turnFacing(person,Math.PI/2)}],pose),/image-right/);
 const endpoint={provider_tag:'test',supported_parameters:{input_references:{max:3},aspect_ratio:{values:['16:9']}}};const payload=imagePayload({appearance:['data:image/png;base64,AA=='],composition:'data:image/png;base64,AA==',prompt:'Style',context:{facingGuides:true}},'test/model',endpoint);assert.match(payload.prompt,/remove every arrow/);assert.match(payload.prompt,/required face\/head or car-front direction/);
});
