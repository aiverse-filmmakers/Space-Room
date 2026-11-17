import {test} from 'node:test';import assert from 'node:assert/strict';
import {applyActions,hostContext,projectRevision} from '../src/actions.ts';
import {newProject} from '../src/model.ts';
test('host batch commits atomically, preserves references and keeps original takes',async()=>{
 const p=newProject(),before=structuredClone(p),revision=await projectRevision(p);
 const result=await applyActions(p,{schema:'scene-room.actions.v1',baseRevision:revision,actions:[{type:'object.update',objectId:p.objects[0].id,patch:{position:[1,2,3],orientation:[.1,.2,.3]}},{type:'camera.set',pose:{t:0,position:[0,1,5],quaternion:[0,0,0,1],focal:50,focus:5,aperture:2.8}}]});
 assert.deepEqual(p,before);assert.deepEqual(result.project.objects[0].position,[1,2,3]);assert.deepEqual(result.project.references,p.references);assert.equal(result.camera!.focal,50);
 await assert.rejects(()=>applyActions(p,{schema:'scene-room.actions.v1',baseRevision:revision,actions:[{type:'object.update',objectId:p.objects[0].id,patch:{position:[1,2,3]}},{type:'object.update',objectId:p.objects[1].id,patch:{size:[-1,1,1]}}]}),/Invalid scene object/);assert.deepEqual(p,before);
});
test('stale, unknown, executable and permission-bearing commands fail before commit',async()=>{
 const p=newProject(),baseRevision=await projectRevision(p);const batch=(actions:unknown[])=>({schema:'scene-room.actions.v1',baseRevision,actions});
 await assert.rejects(()=>applyActions(p,batch([{type:'eval',code:'alert(1)'}])),/Unsupported action/);
 await assert.rejects(()=>applyActions(p,batch([{type:'toString'}])),/Unsupported action/);
 await assert.rejects(()=>applyActions(p,batch([{type:'object.update',objectId:p.objects[0].id,patch:{id:'replace'}}])),/Unsupported action field/);
 p.objects[0].position[0]++;await assert.rejects(()=>applyActions(p,batch([{type:'object.update',objectId:p.objects[0].id,patch:{name:'stale'}}])),/changed/);
});
test('host context excludes image bytes and credentials while declaring bounded actions',async()=>{const p=newProject();p.references=[{id:'ref',name:'Look',data:'data:image/png;base64,PRIVATE'}];const context=await hostContext(p,'Move the table');assert.equal(context.revision,await projectRevision(p));assert.equal(JSON.stringify(context).includes('PRIVATE'),false);assert.ok(context.actions['object.update']);});
test('creative host can set a real shot camera and create an editable planned take',async()=>{
 const p=newProject(),pose={t:0,position:[0,1,5] as [number,number,number],quaternion:[0,0,0,1] as [number,number,number,number],focal:50,focus:5,aperture:2.8};p.storyboard=[{id:'wide',title:'Wide',purpose:'Establish',captured:false,pose}];
 const batch={schema:'scene-room.actions.v1',baseRevision:await projectRevision(p),actions:[{type:'shot.set',shotId:'wide',title:'Low approach',purpose:'Reveal the subject from below',pose:{...pose,position:[0,.3,4]}},{type:'take.plan',name:'Slow approach',mode:'Gimbal',pathStyle:'smooth',ease:true,samples:[pose,{...pose,t:5,position:[0,1,2]}]}]};
 const result=await applyActions(p,batch);assert.equal(result.project.storyboard!.length,1);assert.equal(result.project.storyboard![0].captured,true);assert.deepEqual(result.project.storyboard![0].scene,p.objects);assert.equal(result.project.takes.length,1);assert.equal(result.project.takes[0].duration,5);assert.equal(result.project.takes[0].source,'planned');assert.equal(p.takes.length,0);
 const invalid=structuredClone(batch);invalid.actions[1].samples![1].t=-1;await assert.rejects(()=>applyActions(p,invalid),/duration/);
});
