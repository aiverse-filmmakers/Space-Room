import {test} from 'node:test';import assert from 'node:assert/strict';
import {newProject,parseProject} from '../src/model.ts';import type {ShotCard,GenerationLink} from '../src/model.ts';
import {frameSource,framingKey,frameVersions,completedVersions,selectedVersion,updateFrameState} from '../src/frameImages.ts';
const pose={t:0,position:[0,1,5] as [number,number,number],quaternion:[0,0,0,1] as [number,number,number,number],focal:35,aperture:2.8,focus:5};
const frame:ShotCard={id:'shot-1',title:'Test shot',purpose:'Wide',pose,captured:true};
const result=(id:string,frameId='shot-1',status='completed'):GenerationLink=>({id,kind:'image',frameId,status,name:id,created:'2026-10-29',model:'test/model',framingKey:'abc'});
test('frame generation binds saved geometry and appearance, detects changed framing and missing references',()=>{
 const p=newProject();p.references=[{id:'look',name:'Original',data:'data:image/png;base64,AAAA'}];assert.equal(frameSource(p,{...frame,referenceIds:[]}).references.length,1);const saved={...frame,scene:structuredClone(p.objects),room:p.room,referenceIds:['look']};const key=framingKey(p,saved);
 p.objects[0].position[0]+=3;assert.equal(framingKey(p,saved),key);assert.notEqual(framingKey(p,{...saved,pose:{...pose,focal:50}}),key);assert.notEqual(framingKey({...p,frameFormat:'9:16'},saved),key);
 p.references[0].data='data:image/png;base64,BBBB';assert.notEqual(framingKey(p,saved),key);assert.equal(frameSource(p,saved).references.length,1);p.references=[];assert.throws(()=>frameSource(p,saved),/missing/);
});
test('versions remain frame-local, newest successful is default, arrows never include mockup or failures',()=>{
 const p=newProject();p.generations=[result('a'),result('other','North'),result('b'),result('failed','shot-1','failed')];const versions=completedVersions(frameVersions(p,'shot-1'));assert.deepEqual(versions.map(v=>v.id),['a','b']);assert.equal(selectedVersion(versions)?.id,'b');assert.equal(selectedVersion(versions,'a')?.id,'a');assert.equal(selectedVersion(versions,'missing')?.id,'b');assert.equal(frameVersions(p,'North').length,1);
});
test('frame model/prompt/toggle/version and variant bindings survive project roundtrip without touching camera',()=>{
 const p=newProject();p.storyboard=[frame];p.generations=[result('a'),result('b')];const next=updateFrameState(p,'shot-1',{model:'test/model',prompt:'Warm sunset',view:'generated',selected:'b'});const mock=updateFrameState(next,'shot-1',{view:'mockup'});const restored=parseProject(JSON.parse(JSON.stringify(mock)));assert.deepEqual(restored.frameImages,[{frameId:'shot-1',model:'test/model',prompt:'Warm sunset',view:'mockup',selected:'b'}]);assert.deepEqual(restored.generations,p.generations);assert.deepEqual(restored.storyboard,p.storyboard);assert.equal(p.frameImages,undefined);assert.throws(()=>parseProject({...restored,frameImages:[{frameId:'x',view:'other'}]}),/settings/);
});
test('reference choices are per frame, persist and may be deliberately empty',()=>{
 const p=newProject();p.references=[{id:'original',name:'Original',data:'data:image/png;base64,AAAA'},{id:'variant',name:'Generated',data:'data:image/png;base64,BBBB'}];
 const next=updateFrameState(p,'shot-1',{referenceIds:['variant'],basePrompt:'Changed prompt'});const restored=parseProject(JSON.parse(JSON.stringify(next)));
 assert.deepEqual(frameSource(restored,frame,restored.frameImages![0].referenceIds).references.map(r=>r.id),['variant']);
 assert.equal(frameSource(restored,frame,[]).references.length,0);assert.notEqual(framingKey(restored,frame,['original']),framingKey(restored,frame,['variant']));
});
