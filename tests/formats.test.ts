import {applyActions,projectRevision} from '../src/actions.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,Box3,Mesh} from 'three';
import {frameFormats,frameSpec} from '../src/formats.ts';
import type {FrameFormat} from '../src/formats.ts';
import {newProject,parseProject,trajectory} from '../src/model.ts';
import {subjectFraming} from '../src/subjectFraming.ts';
import {buildSubject} from '../src/setGeometry.ts';
import {storyboardManifest} from '../src/storyboard.ts';
import {shotManifest} from '../src/shot.ts';
import {imagePayload,videoPayload,validateGeneration} from '../generation.mjs';
const pose={t:0,position:[4,2,6] as [number,number,number],quaternion:[0,0,0,1] as [number,number,number,number],focal:35,focus:5,aperture:2.8};
test('all global formats have even video dimensions, survive project files and reject unsupported values',()=>{
 for(const format of Object.keys(frameFormats) as FrameFormat[]){const d=frameSpec(format);assert.equal(Math.max(d.width,d.height),1280);assert.equal(d.width%2,0);assert.equal(d.height%2,0);assert.ok(Math.abs(d.width/d.height-d.ratio)<.006);const p=newProject();p.frameFormat=format;assert.equal(parseProject(JSON.parse(JSON.stringify(p))).frameFormat,format);}
 assert.throws(()=>parseProject({...newProject(),frameFormat:'21:1'}),/Unsupported frame format/);
});
test('wide framing fits the actual subject within portrait, square, classic and cinema cameras',()=>{
 const o=newProject().objects[1],group=buildSubject(o);group.updateMatrixWorld(true);const bounds=new Box3().setFromObject(group,true);
 for(const format of ['9:16','1:1','4:3','2.39:1'] as FrameFormat[]){const ratio=frameSpec(format).ratio,p=subjectFraming(o,'Wide',pose,ratio),c=new PerspectiveCamera(50,ratio,.05,500);c.filmGauge=36;c.position.fromArray(p.position);c.quaternion.fromArray(p.quaternion);c.setFocalLength(p.focal);c.updateMatrixWorld();for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const q=new Vector3(x,y,z).project(c);assert.ok(Math.abs(q.x)<1&&Math.abs(q.y)<1&&q.z<1,`${format}: clipped subject`);}}
 group.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
});
test('storyboard, shot package and trajectory metadata agree with the single project format',()=>{
 const p=newProject();p.frameFormat='9:16';const take={id:'t',name:'Move',mode:'Gimbal' as const,source:'recorded' as const,duration:1,created:'now',scene:p.objects,room:p.room,samples:[pose,{...pose,t:1}]};
 const shot=shotManifest(take,[],'',p.frameFormat),board=storyboardManifest(p,[]),camera=trajectory(take,p.frameFormat);assert.equal(shot.aspectRatio,'9:16');assert.equal(shot.width,720);assert.equal(shot.height,1280);assert.equal(board.aspectRatio,'9:16');assert.equal(camera.frame.format,'9:16');assert.equal(camera.sensor.height,36);assert.equal(camera.sensor.width,20.25);assert.ok(board.page.height>2550);
});
test('provider requests use the selected format and reject unsupported formats instead of silently reverting',()=>{
 const input={id:'test',kind:'image',name:'Test',prompt:'Film',appearance:['data:image/png;base64,AA=='],composition:'data:image/png;base64,AA==',aspectRatio:'9:16'};
 const endpoint={provider_tag:'test',supported_parameters:{input_references:{max:3},aspect_ratio:{values:['16:9','9:16']}}};assert.equal(imagePayload(validateGeneration(input),'test',endpoint).aspect_ratio,'9:16');assert.throws(()=>imagePayload({...input,aspectRatio:'2.39:1'},'test',endpoint),/aspect ratio/);
 const caps={supported_durations:[5],supported_aspect_ratios:['9:16'],supported_resolutions:['720p'],supported_frame_images:['first_frame']};assert.equal(videoPayload({...input,duration:5},'test',caps,'frame').aspect_ratio,'9:16');assert.throws(()=>videoPayload({...input,aspectRatio:'1:1',duration:5},'test',caps,'frame'),/aspect ratio/);
});

test('the host format command changes one global field and rejects unsupported ratios atomically',async()=>{
 const p=newProject(),baseRevision=await projectRevision(p),before=structuredClone(p);
 const batch=(format:string)=>({schema:'scene-room.actions.v1',baseRevision,actions:[{type:'project.format',format}]});
 const result=await applyActions(p,batch('4:3'));assert.equal(result.project.frameFormat,'4:3');assert.deepEqual(result.project.objects,p.objects);assert.deepEqual(p,before);
 await assert.rejects(()=>applyActions(p,batch('21:1')),/Unsupported frame format/);assert.deepEqual(p,before);
});
