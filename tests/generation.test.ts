import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {unzipSync} from 'fflate';
import {GenerationService,imagePayload,videoPayload,validateGeneration} from '../generation.mjs';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',image='data:image/png;base64,'+png;
const endpoint={provider_tag:'test-provider',supported_parameters:{input_references:{type:'range',min:0,max:4},aspect_ratio:{values:['16:9']},n:{min:1,max:1}},pricing:[{billable:'output_image',unit:'image',cost_usd:.01}]};
const video={id:'video-test',supported_durations:[5,10],supported_aspect_ratios:['16:9'],supported_resolutions:['720p'],supported_frame_images:['first_frame','last_frame'],pricing_skus:{video_tokens:'0.001'}};
const request=(id:string)=>({id,kind:'image',name:'Styled frame',prompt:'Preserve the original look',appearance:[image],composition:image,context:{takeId:'take-a'}});
function harness(t:any,respond?:(url:string,opts:any)=>Promise<any>){const root=mkdtempSync(join(tmpdir(),'scene-room-generation-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const calls:{url:string;opts:any}[]=[];
 const fetchImpl=async(url:string,opts:any)=>{calls.push({url,opts});if(url.endsWith('/endpoints'))return {ok:true,json:async()=>({endpoints:[endpoint]})};if(url.endsWith('/videos/models'))return {ok:true,json:async()=>({data:[video]})};if(respond)return respond(url,opts);return {ok:true,json:async()=>({data:[{b64_json:png,media_type:'image/png'}],usage:{cost:.01}})};};
 const service=new GenerationService({root,enabled:true,key:'test-secret',imageModel:'image-test',videoModel:'video-test',fetchImpl});return {root,calls,service,fetchImpl};}
test('paid generation guard executes before validation, metadata or provider access',async(t)=>{const {service,calls}=harness(t);service.enabled=false;await assert.rejects(()=>service.submit(request('guarded')),/disabled/);assert.equal(calls.length,0);});
test('image submission preserves reference roles and exact inputs, pins endpoint, persists result and deduplicates',async(t)=>{
 const {service,calls,root,fetchImpl}=harness(t),input=request('image-a'),job=await service.submit(input);assert.equal(job.status,'completed');assert.equal(job.usage.cost,.01);assert.equal(job.submitted.references[0].role,'appearance');assert.equal(job.submitted.references[1].role,'composition');assert.equal(service.content(job.id).mime,'image/png');assert.equal(readFileSync(join(root,'image-a','input-1.png')).toString('base64'),png);
 const submitted=JSON.parse(calls.find(c=>c.url.endsWith('/images'))!.opts.body);assert.deepEqual(submitted.provider,{only:['test-provider'],allow_fallbacks:false});assert.equal(submitted.input_references.length,2);
 const afterRestart=new GenerationService({root,enabled:true,key:'test-secret',fetchImpl});await afterRestart.submit(input);assert.equal(calls.filter(c=>c.url.endsWith('/images')).length,1);await assert.rejects(()=>afterRestart.submit({...input,prompt:'Changed request'}),/different generation/);
 const archive=unzipSync(service.package(job.id));assert.ok(archive['output.png']);assert.ok(archive['input-1.png']);assert.equal(new TextDecoder().decode(archive['job.json']).includes('test-secret'),false);
});
test('unsupported or incomplete inputs fail before a generation is submitted',()=>{
 assert.throws(()=>validateGeneration({...request('bad'),appearance:[]}),/appearance/);assert.throws(()=>imagePayload(request('bad'),'image-test',{...endpoint,supported_parameters:{...endpoint.supported_parameters,input_references:{max:1}}}),/all appearance/);
 assert.throws(()=>videoPayload({duration:6},'video-test',video,image),/duration/);assert.throws(()=>videoPayload({duration:5},'video-test',{...video,supported_frame_images:['first_frame']},image,image),/frame controls/);
 const payload=videoPayload({duration:5,prompt:'Dolly in'},'video-test',video,image,image);assert.equal(payload.frame_images.length,2);assert.equal('input_references' in payload,false);assert.equal('camera' in payload,false);
});
test('ambiguous submission retains an uncertain record and never silently resubmits after restart',async(t)=>{
 const {service,root,calls,fetchImpl}=harness(t,async()=>{throw Error('Connection lost after request');});const input=request('uncertain-a'),job=await service.submit(input);assert.equal(job.status,'uncertain');assert.match(job.error,/Connection lost/);
 const restarted=new GenerationService({root,enabled:true,key:'test-secret',fetchImpl});const again=await restarted.submit(input);assert.equal(again.status,'uncertain');assert.equal(calls.filter(c=>c.url.endsWith('/images')).length,1);
});
test('definitive provider rejection is failed, not a successful or automatically retried generation',async(t)=>{
 const {service}=harness(t,async()=>({ok:false,status:402,json:async()=>({error:{message:'Insufficient credits'}})}));const job=await service.submit(request('rejected'));assert.equal(job.status,'failed');assert.match(job.error,/402/);assert.throws(()=>service.content(job.id),/No completed/);
});
test('video job survives restart, downloads authenticated content and ignores returned external URLs',async(t)=>{
 let polls=0;const {service,root,calls,fetchImpl}=harness(t,async(url,opts)=>{
  if(url.endsWith('/images'))return {ok:true,json:async()=>({data:[{b64_json:png}]})};
  if(url.endsWith('/videos'))return {ok:true,json:async()=>({id:'provider-job',status:'pending',polling_url:'https://malicious.invalid/steal'})};
  if(url.endsWith('/provider-job')){polls++;return {ok:true,json:async()=>({status:polls===1?'in_progress':'completed',unsigned_urls:['https://malicious.invalid/steal'],usage:{cost:.25}})};}
  assert.ok(url.endsWith('/provider-job/content?index=0'));assert.equal(opts.headers.Authorization,'Bearer test-secret');const bytes=Buffer.from([0,0,0,20,102,116,121,112,105,115,111,109]);return new Response(bytes,{headers:{'Content-Type':'video/mp4'}});
 });
 await service.submit(request('styled-start'));const videoJob=await service.submit({id:'video-a',kind:'video',name:'Dolly',prompt:'Move smoothly',duration:5,firstFrameJob:'styled-start'});assert.equal(videoJob.status,'pending');assert.equal(videoJob.providerJobId,'provider-job');
 const restarted=new GenerationService({root,enabled:false,key:'test-secret',fetchImpl});assert.equal((await restarted.refresh('video-a')).status,'in_progress');const ready=await restarted.refresh('video-a');assert.equal(ready.status,'completed');assert.equal(ready.usage.cost,.25);assert.equal(restarted.content('video-a').mime,'video/mp4');await restarted.refresh('video-a');assert.equal(polls,2);assert.equal(calls.some(c=>c.url.includes('malicious')),false);
});
test('completed video download can be retried without creating a second paid job',async(t)=>{
 let downloads=0,submissions=0;const {service}=harness(t,async(url)=>{
  if(url.endsWith('/images'))return {ok:true,json:async()=>({data:[{b64_json:png}]})};
  if(url.endsWith('/videos')){submissions++;return {ok:true,json:async()=>({id:'retry-provider',status:'pending'})};}
  if(url.endsWith('/retry-provider'))return {ok:true,json:async()=>({status:'completed'})};
  downloads++;if(downloads===1)return {ok:false,status:503};return new Response(Buffer.from([0,0,0,20,102,116,121,112,105,115,111,109]));
 });await service.submit(request('retry-frame'));await service.submit({id:'retry-video',kind:'video',name:'Retry download',prompt:'Move',duration:5,firstFrameJob:'retry-frame'});
 await assert.rejects(()=>service.refresh('retry-video'),/download failed/);assert.equal(service.read('retry-video').providerJobId,'retry-provider');assert.equal(service.read('retry-video').status,'downloading');assert.equal((await service.refresh('retry-video')).status,'completed');assert.equal(submissions,1);assert.equal(downloads,2);
});
test('interrupted submission remains uncertain after a server restart',async(t)=>{const {service}=harness(t);service.save({id:'interrupted',kind:'video',status:'submitting',submitted:{references:[]}});const job=await service.refresh('interrupted');assert.equal(job.status,'uncertain');assert.match(job.error,/Check provider history/);});
test('selected image model is discovered, independently checked, pinned and saved without video discovery',async(t)=>{
 const root=mkdtempSync(join(tmpdir(),'scene-room-models-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const calls:string[]=[];let submitted:any;
 const fetchImpl=async(url:string,opts:any)=>{calls.push(url);if(url.endsWith('/images/models'))return {ok:true,json:async()=>({data:[{id:'test/model-b',name:'Model B',supported_parameters:endpoint.supported_parameters},{id:'text/only',supported_parameters:{}}]})};if(url.endsWith('/endpoints'))return {ok:true,json:async()=>({endpoints:[endpoint]})};submitted=JSON.parse(opts.body);return {ok:true,json:async()=>({data:[{b64_json:png}]})};};
 const service=new GenerationService({root,enabled:true,key:'test-secret',fetchImpl});assert.equal((await service.imageModels()).models.length,1);
 const job=await service.submit({...request('selected-b'),model:'test/model-b'});assert.equal(job.status,'completed');assert.equal(job.model,'test/model-b');assert.equal(submitted.model,'test/model-b');assert.equal(calls.some(u=>u.includes('/videos')),false);assert.equal(calls.filter(u=>u.endsWith('/images/models')).length,1);
 const count=calls.filter(u=>u.endsWith('/images')).length;await assert.rejects(()=>service.submit({...request('unknown'),model:'test/unknown'}),/not available/);await assert.rejects(()=>service.submit({...request('portrait'),model:'test/model-b',aspectRatio:'9:16'}),/format/);assert.equal(calls.filter(u=>u.endsWith('/images')).length,count);
 assert.throws(()=>validateGeneration({...request('unsafe'),model:'../bad'}),/model/);
});
