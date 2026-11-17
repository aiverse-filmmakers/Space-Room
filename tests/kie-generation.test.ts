import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {KieGenerationService} from '../kie-generation.mjs';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=';
const image='data:image/png;base64,'+png;
const request={id:'example',kind:'image',name:'North',model:'kie/nano-banana-2-1',aspectRatio:'16:9',prompt:'Keep the subject',appearance:[image],composition:image};
test('Kie image job keeps inputs, records the task, retrieves output, and never submits twice',async t=>{
 const root=mkdtempSync(join(tmpdir(),'scene-kie-'));t.after(()=>rmSync(root,{recursive:true,force:true}));let creates=0,uploads=0;
 const fetchImpl=async (url:string)=>{
  if(url.includes('file-base64-upload')){uploads++;return Response.json({code:200,data:{downloadUrl:'https://tempfile.redpandaai.co/input.png'}});}
  if(url.includes('createTask')){creates++;return Response.json({code:200,data:{taskId:'task123'}});}
  if(url.includes('recordInfo'))return Response.json({code:200,data:{state:'success',resultJson:JSON.stringify({resultUrls:['https://file.aiquickdraw.com/output.png']})}});
  if(url==='https://file.aiquickdraw.com/output.png')return new Response(Buffer.from(png,'base64'));
  throw Error('Unexpected address');
 };
 const service=new KieGenerationService({root,key:'test',enabled:true,fetchImpl});
 const job=await service.submit(request);assert.equal(job.status,'pending');assert.deepEqual(job.submitted.references.map((ref:{role:string})=>ref.role),['composition','appearance']);assert.equal((await service.submit(request)).status,'pending');assert.equal(creates,1);assert.equal(uploads,2);
 assert.equal((await service.refresh('example')).status,'completed');assert.equal(service.content('example').mime,'image/png');
});
test('Kie never creates a generation when disabled',async t=>{
 const root=mkdtempSync(join(tmpdir(),'scene-kie-'));t.after(()=>rmSync(root,{recursive:true,force:true}));let called=false;
 const service=new KieGenerationService({root,key:'test',enabled:false,fetchImpl:async()=>{called=true;throw Error();}});
 await assert.rejects(()=>service.submit(request),/disabled/);assert.equal(called,false);
});
test('each provider receives its documented model and image input field',async t=>{
 const root=mkdtempSync(join(tmpdir(),'scene-kie-models-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const sent:any[]=[];
 const fetchImpl=async (url:string,opts:any)=>{if(url.includes('file-base64-upload'))return Response.json({code:200,data:{downloadUrl:'https://tempfile.redpandaai.co/input.png'}});sent.push(JSON.parse(opts.body));return Response.json({code:200,data:{taskId:'task123'}});};
 const service=new KieGenerationService({root,key:'test',enabled:true,fetchImpl});
 for(const [id,expected,field] of [['kie/seedream-5-5','seedream/5-5-image-to-image','image_urls'],['kie/gpt-image-2','gpt-image-2-image-to-image','input_urls'],['kie/qwen-2-1','qwen2-1/image-to-image','image_urls']]){const job=await service.submit({...request,id:id.replace('/','-'),model:id});assert.equal(job.status,'pending');assert.equal(job.promptIsExact,true);const payload=sent.at(-1);assert.equal(payload.model,expected);assert.equal(payload.input.prompt,job.prompt);assert.equal(payload.input[field].length,2);}
});
