import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateImportedScene} from '../src/sceneImport.ts';
import {newProject,parseProject} from '../src/model.ts';

const proposal=()=>({scene:{
 summary:'Approximated interior from supplied image',
 room:[12,4,15],
 environment:{kind:'interior',sky:'#aabbcc',ground:'#123456',terrain:'flat'},
 analysis:{viewpoint:'Standing at doorway',scaleAnchor:'Door height',relationships:[],uncertainties:['Rear wall depth needs review']},
 camera:{position:[0,1.7,6],target:[0,1.4,0],focal:35},
 objects:[{id:'table',name:'Desk',kind:'box',position:[0,.8,-2],size:[2,.2,1],color:'#aaaaaa',rotation:0,screenBounds:[100,200,800,900],description:'Desk at centre'}],
 assumptions:['Estimated dimensions']
}});

test('external ChatGPT scene validates locally, normalizing image-space bounds',()=>{
 const imported=validateImportedScene(proposal());
 assert.equal(imported.scene.objects.length,1);
 assert.deepEqual(imported.scene.objects[0].screenBounds,[.1,.2,.8,.9]);
 assert.deepEqual(imported.scene.analysis.uncertainties,['Rear wall depth needs review']);
 const p=parseProject({...newProject(),objects:imported.scene.objects,room:imported.scene.room,environment:imported.scene.environment,analysis:imported.scene.analysis});
 assert.equal(p.objects[0].name,'Desk');
});

test('malformed external scene is rejected before replacing work',()=>{
 const before=newProject();
 assert.throws(()=>validateImportedScene({...proposal(),scene:{...proposal().scene,objects:[{id:'bad',name:'Trap',kind:'script',position:[0,0,0],size:[1,1,1],color:'#ffffff',rotation:0}]}}),/Invalid 3D object/);
 assert.throws(()=>validateImportedScene({...proposal(),scene:{...proposal().scene,room:[Infinity,4,10]}}),/Invalid scene layout/);
 assert.deepEqual(before.objects.length,3);
});

test('missing geometry identifiers are assigned without accepting duplicates',()=>{
 const s=proposal();
 delete (s.scene.objects[0] as Record<string,unknown>).id;
 const result=validateImportedScene(s);
 assert.match(result.scene.objects[0].id,/^[0-9a-f-]{36}$/);
 assert.throws(()=>validateImportedScene({...proposal(),scene:{...proposal().scene,objects:[proposal().scene.objects[0],proposal().scene.objects[0]]}}),/Duplicate object IDs/);
});
