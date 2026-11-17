import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProject} from '../src/model.ts';
import type {ShotCard} from '../src/model.ts';
import {cameraLanguage,storyboardManifest} from '../src/storyboard.ts';
test('storyboard maps references and describes the saved set instead of the current set',()=>{
 const p=newProject();p.references=[{id:'look-a',name:'Original look',data:'data:image/jpeg;base64,AA=='}];
 const card:ShotCard={id:'shot-a',title:'Hero',purpose:'Hold on the hero',captured:true,pose:{t:0,position:[0,1,5],quaternion:[0,0,0,1],focal:50,focus:5,aperture:2.8},scene:[{id:'hero',name:'Saved hero',kind:'car',position:[0,0,0],size:[4,2,2],color:'#ffffff',yaw:0}],referenceIds:['look-a']};
 const language=cameraLanguage(card,p);assert.equal(language.facing,'N');assert.equal(language.subjects[0].name,'Saved hero');assert.equal(language.subjects[0].screenHorizontal,'centre');assert.ok(Math.abs(language.horizontalFovDegrees-39.59775)<.001);
 const manifest=storyboardManifest(p,[card]);assert.equal(manifest.references[0].path,'references/01.jpg');assert.equal(manifest.shots[0].sceneSnapshot,'saved');assert.deepEqual(manifest.shots[0].referenceIds,['look-a']);
});
