import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateScene,understandScene} from '../api.mjs';
const scene={summary:'Room',room:[8,3,10],objects:[{id:'table',name:'Table',description:'Table upright on floor',orientation:[0,0,0],occludedBy:[],kind:'box',position:[0,.5,0],size:[2,1,1],color:'#aabbcc',rotation:0}],camera:{position:[4,1.5,5],target:[0,1,0],focal:35},analysis:{viewpoint:'Eye-level room view',scaleAnchor:'Table is two metres wide',relationships:[],uncertainties:['Hidden wall']},assumptions:['Hidden wall is inferred']};
test('scene validation rejects unsupported geometry and impossible dimensions',()=>{
 assert.equal(validateScene(scene),scene);
 assert.throws(()=>validateScene({...scene,room:[-1,3,3]}));
 assert.throws(()=>validateScene({...scene,objects:[{...scene.objects[0],kind:'code'}]}));
});
test('AI scene adapter sends reference and parses the response contract',async()=>{
 let request:any;
 const mockFetch=async(url:string,options:any)=>{
  request=JSON.parse(options.body);
  assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
  return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(scene)}}],usage:{prompt_tokens:20}})};
 };
 const output=await understandScene({instruction:'Build this room',images:['data:image/png;base64,AA==']},mockFetch,'test-only-key');
 assert.equal(output.scene.summary,'Room');
 assert.equal(request.messages[1].content[1].type,'image_url');
 assert.ok(request.max_tokens<=3500);
});
test('invalid or failed AI output never silently becomes a substitute scene',async()=>{
 const badResponse=async()=>({ok:true,json:async()=>({choices:[{message:{content:'not JSON'}}]})});
 const failure=async()=>({ok:false,status:401,json:async()=>({})});
 await assert.rejects(()=>understandScene({instruction:'build'},badResponse,'test-only-key'),/unreadable/);
 await assert.rejects(()=>understandScene({instruction:'build'},failure,'test-only-key'),/401/);
});
test('image-bound normalization supports mixed VLM coordinate scales without clamping invalid data',async()=>{
 const {normalizeImageBounds}=await import('../api.mjs');
 const result=normalizeImageBounds({...structuredClone(scene),objects:[{...scene.objects[0],screenBounds:[.28,528,.72,765]}]});
 assert.deepEqual(result.objects[0].screenBounds,[.28,.528,.72,.765]);assert.doesNotThrow(()=>validateScene(result));
 const bad=normalizeImageBounds({...structuredClone(scene),objects:[{...scene.objects[0],screenBounds:[0,-20,1001,800]}]});assert.throws(()=>validateScene(bad),/bounds/);
});
test('spatial reading rejects a nearby subject placed far away and requires orientation evidence',async()=>{
 const {validateAnalysis}=await import('../sceneAnalysis.mjs');
 const car={id:'car',name:'Hero',kind:'car',position:[0,0,0],size:[4,1.3,1.7],orientation:[0,0,0],description:'Car in profile',occludedBy:[]};
 const flower={id:'flower',name:'Background subject',kind:'flower',position:[0,0,-2],size:[3,5,3],orientation:[.2,.3,0],description:'Immediately behind the hero, facing slightly inward',occludedBy:['car']};
 const result={...structuredClone(scene),camera:{position:[0,1,10],target:[0,1,0],focal:35},objects:[car,flower],analysis:{viewpoint:'Low viewpoint',scaleAnchor:'Hero length 4m',relationships:[{subject:'flower',relation:'near',target:'car',maxDistance:4,evidence:'Shares the local ground patch'},{subject:'flower',relation:'behind',target:'car',evidence:'Stem is partly occluded by the hero'}],uncertainties:['Unseen backs']}};
 assert.equal(validateAnalysis(result),result);const bad=structuredClone(result);bad.objects[1].position[2]=-60;assert.throws(()=>validateAnalysis(bad),/near/);const missing=structuredClone(result);delete missing.objects[1].orientation;assert.throws(()=>validateAnalysis(missing),/orientation/);
});

test('live-found reversed behind coordinates are rejected rather than accepted as a plausible set',async()=>{
 const {validateAnalysis}=await import('../sceneAnalysis.mjs');
 const car={id:'car',name:'Car',kind:'car',position:[0,0,0],size:[4,1.3,1.7],rotation:0,color:'#eeeeee',orientation:[0,0,0],description:'Side profile car',occludedBy:[]};
 const flower={id:'flower',name:'Flower',kind:'flower',position:[0,0,4],size:[3,5,3],rotation:0,color:'#ffffff',orientation:[.1,.2,0],description:'Stem hidden behind the car',occludedBy:['car']};
 const result={...structuredClone(scene),camera:{position:[0,1,15],target:[0,1,0],focal:35},objects:[car,flower],analysis:{viewpoint:'Low view',scaleAnchor:'Car length4m',relationships:[{subject:'flower',relation:'behind',target:'car',evidence:'Car occludes the lower stem'}],uncertainties:['Depth is estimated']}};
 assert.throws(()=>validateAnalysis(result),/contradicts behind/);result.objects[1].position[2]=-2;assert.equal(validateAnalysis(result),result);
});
test('mixed fraction/percentage bounds within one axis are rejected without guessing image geometry',async()=>{
 const {normalizeImageBounds}=await import('../api.mjs');const result=normalizeImageBounds({...structuredClone(scene),objects:[{...scene.objects[0],screenBounds:[.28,52,.72,.76]}]});assert.throws(()=>validateScene(result),/image bounds/);
});
