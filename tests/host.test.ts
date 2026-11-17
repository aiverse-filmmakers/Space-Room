import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHostBridge} from '../src/host.ts';
import {applyActions,projectRevision,hostContext} from '../src/actions.ts';
import {newProject,parseProject} from '../src/model.ts';
import type {Pose,ShotCard} from '../src/model.ts';
import {compareContinuity} from '../src/continuity.ts';
import {panelsFromTake} from '../src/panels.ts';
import {newProduction,requestPrerequisites} from '../src/production.ts';
const pose:Pose={t:0,position:[0,1,5],quaternion:[0,0,0,1],focal:50,aperture:2.8,focus:5};
test('pin, script, appearance bytes and take settings invalidate pending commands; thumbnails do not',async()=>{
 const p=newProject();p.storyboard=[{id:'s',title:'Shot',purpose:'',captured:false,pose}];p.production=newProduction(p);
 const revision=await projectRevision(p);p.storyboard[0].thumbnail='data:image/png;base64,AA';assert.equal(await projectRevision(p),revision);
 for(const mutate of [(v:typeof p)=>{v.storyboard![0].pinned=true;},(v:typeof p)=>{v.production!.script.text='New action';},(v:typeof p)=>{v.name='Changed';}]){const candidate=structuredClone(p);mutate(candidate);assert.notEqual(await projectRevision(candidate),revision);}
 p.storyboard[0].pinned=true;const pinnedRevision=await projectRevision(p);await assert.rejects(()=>applyActions(p,{schema:'scene-room.actions.v1',baseRevision:pinnedRevision,actions:[{type:'shot.set',shotId:'s',title:'Replace',purpose:'',pose}]}),/Unpin/);
 const context=await hostContext(p,'');assert.equal(context.production!.script.id,p.production.script.id);
});
test('host provides live context, serializes commands, rejects busy and stale view, and isolates subscribers',async()=>{
 let p=newProject(),busy=false;const view={camera:pose,subjectId:null,shotId:null,takeId:null,time:0,mode:'Gimbal',snapshot:null};
 const host=createHostBridge({read:()=>({project:p,view,instruction:'Direct',busy}),execute:async input=>{const result=await applyActions(p,input);p=result.project;return result.summary;}});
 const events:string[]=[];const unsubscribe=host.subscribe(e=>events.push(e.type));host.subscribe(()=>{throw Error('subscriber failure');});
 const context=await host.readContext();assert.deepEqual(context.view.camera,pose);
 const command={schema:'scene-room.actions.v1',baseRevision:context.revision,expectedViewRevision:context.viewRevision,actions:[{type:'object.update',objectId:p.objects[0].id,patch:{name:'Updated'}}]};
 await host.execute(command);assert.equal(p.objects[0].name,'Updated');assert.deepEqual(events,['command.completed']);
 await assert.rejects(()=>host.execute(command),/changed/);assert.equal(events.at(-1),'command.failed');
 const fresh=await host.readContext();view.camera={...pose,focal:85};await assert.rejects(()=>host.execute({...command,baseRevision:fresh.revision}),/Camera or selection/);
 busy=true;await assert.rejects(()=>host.execute(command),/Wait/);busy=false;
 unsubscribe();host.changed();assert.equal(events.at(-1),'command.failed');
});
test('continuity choices and sampled temporal panels survive project save while original motion is preserved',()=>{
 const p=newProject();const take={id:'t',name:'Move',mode:'Gimbal' as const,source:'planned' as const,duration:4,created:'now',scene:p.objects,room:p.room,samples:[pose,{...pose,t:4,position:[2,1,5] as [number,number,number]}]};
 p.takes=[take];p.storyboard=[{id:'s',title:'Shot',purpose:'',captured:true,pinned:true,pose,scene:p.objects,panels:panelsFromTake(take),continuity:{comparisonId:'other',axis:[p.objects[0].id,p.objects[1].id]},continuityNote:'Reverse intentionally'}];
 const copy=parseProject(JSON.parse(JSON.stringify(p)));assert.deepEqual(copy.storyboard![0].continuity,p.storyboard[0].continuity);assert.deepEqual(copy.storyboard![0].panels!.map(p=>[p.role,p.time,p.pose.position[0]]),[['start',0,0],['middle',2,1],['end',4,2]]);assert.equal(take.samples.length,2);
});
test('continuity detects actual geography and axis differences and reports unknown snapshots',()=>{
 const p=newProject();const a:ShotCard={id:'a',title:'A',purpose:'',captured:true,pose,scene:structuredClone(p.objects)};const b=structuredClone(a);b.id='b';b.scene![0].position[0]+=1;b.scene![1].rotation=1;
 const report=compareContinuity(a,b,p);assert.ok(report.issues.some(i=>i.kind==='position'));assert.ok(report.issues.some(i=>i.kind==='orientation'));
 b.scene=undefined;assert.ok(compareContinuity(a,b,p).unknown.length);
});
test('creative requests require explicit story permission and bridge endpoint; frozen angles do not require script',()=>{
 const p=newProject();p.references=[{id:'hero',name:'Hero',data:'data:image/png;base64,AA'}];p.production=newProduction(p);
 assert.deepEqual(requestPrerequisites(p,'New angles'),[]);assert.ok(requestPrerequisites(p,'Imagine').length);p.production.policy='improvise';assert.deepEqual(requestPrerequisites(p,'Imagine'),[]);assert.ok(requestPrerequisites(p,'A→B').length);
 p.references.push({id:'end',name:'End',data:'data:image/png;base64,BB'});p.production.endId='end';assert.deepEqual(requestPrerequisites(p,'A→B'),[]);
});
test('a second host command cannot enter while the first is rendering or committing',async()=>{
 const p=newProject();let release!:()=>void,calls=0;const pending=new Promise<void>(resolve=>{release=resolve;});
 const host=createHostBridge({read:()=>({project:p,view:{subjectId:null,shotId:null,takeId:null,time:0,mode:'Gimbal',snapshot:null},busy:false,instruction:''}),execute:async()=>{calls++;await pending;return ['Done'];}});
 const first=host.execute({});await assert.rejects(()=>host.execute({}),/Wait/);assert.equal(calls,1);release();await first;
});
