import {GenerationService,validateGeneration} from './generation.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Kie model and upload API documentation, read 16 November 2026:
// https://docs.kie.ai/market/google/nanobanana-2-1
// https://docs.kie.ai/file-upload-api/upload-file-base-64
const modelId='kie/nano-banana-2-1';
const ratios=['1:1','2:3','3:2','4:3','4:5','9:16','16:9','21:9'];
const commonRatios=['1:1','3:2','4:3','9:16','16:9','21:9'];
const models=[
 {id:'kie/seedream-5-5',name:'Seedream 5.5',group:'ByteDance',apiModel:'seedream/5-5-image-to-image',inputKey:'image_urls',extras:{size:'1K',output_format:'png'},maxReferences:10,aspectRatios:commonRatios},
 {id:modelId,name:'Nano Banana 2.1',group:'Google',apiModel:'nano-banana-2-1',inputKey:'image_input',extras:{resolution:'1K',output_format:'png'},maxReferences:10,aspectRatios:ratios},
 {id:'kie/nano-banana-2',name:'Nano Banana 2',group:'Google',apiModel:'nano-banana-2',inputKey:'image_input',extras:{resolution:'1K',output_format:'png'},maxReferences:10,aspectRatios:ratios},
 {id:'kie/gpt-image-2',name:'GPT Image 2',group:'OpenAI',apiModel:'gpt-image-2-image-to-image',inputKey:'input_urls',extras:{resolution:'1K'},maxReferences:16,aspectRatios:ratios},
 {id:'kie/qwen-2-1',name:'Qwen 2.1',group:'Qwen',apiModel:'qwen2-1/image-to-image',inputKey:'image_urls',extras:{resolution:'1K',output_format:'png'},maxReferences:10,aspectRatios:commonRatios}
];
const headers=key=>({Authorization:`Bearer ${key}`,'Content-Type':'application/json'});
export class KieGenerationService extends GenerationService {
 constructor(options={}){super(options);this.imageModel=modelId;}
 async imageModels(){return {enabled:this.enabled&&!!this.key,defaultModel:modelId,models};}
 async capabilities(){throw Error('Kie video generation is not connected yet.');}
 async request(url,options={}){
  const response=await this.fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(60000)});
  const data=await response.json();
  if(!response.ok||data.code!==200){const e=Error(`Kie.ai request failed (${data.code||response.status}).`);e.definitive=true;throw e;}
  return data.data;
 }
 async submit(raw){
  if(!this.enabled||!this.key)throw Error('Kie.ai generation is disabled. No request was sent.');
  const input=validateGeneration(raw);
  const selected=models.find(m=>m.id===input.model);
  if(input.kind!=='image'||!selected||!selected.aspectRatios.includes(input.aspectRatio??'16:9')||input.appearance.length+1>selected.maxReferences)throw Error('Choose a supported Kie.ai image model and frame format.');
  const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
  if(existsSync(join(this.dir(input.id),'job.json'))){const prior=this.read(input.id);if(prior.requestHash!==hash)throw Error('This request ID belongs to a different image.');return this.public(prior);}
  if(this.active.has(input.id))throw Error('This request is already being submitted.');
  this.active.set(input.id,true);
  let job={id:input.id,kind:'image',name:input.name,created:new Date().toISOString(),status:'preparing',model:input.model,prompt:input.prompt,promptIsExact:true,context:input.context??{},requestHash:hash,submitted:{aspect_ratio:input.aspectRatio??'16:9',references:[]}};
  try{
   this.save(job);const urls=[],refs=[input.composition,...input.appearance];
   for(let i=0;i<refs.length;i++){
    const data=refs[i],mime=data.slice(5,data.indexOf(';')),file=`input-${i+1}.${mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png'}`;
    writeFileSync(join(this.dir(job.id),file),Buffer.from(data.slice(data.indexOf(',')+1),'base64'));
    job.submitted.references.push({file,mime,role:i===0?'composition':'appearance'});this.save(job);
    const uploaded=await this.request('https://kieai.redpandaai.co/api/file-base64-upload',{method:'POST',headers:headers(this.key),body:JSON.stringify({base64Data:data,uploadPath:'scene-room',fileName:`${randomUUID()}.${file.split('.').at(-1)}`})});
    if(typeof uploaded?.downloadUrl!=='string'||!uploaded.downloadUrl.startsWith('https://'))throw Error('Kie.ai did not return a valid uploaded image.');urls.push(uploaded.downloadUrl);
   }
   job.status='submitting';this.save(job);
   const result=await this.request('https://api.kie.ai/api/v1/jobs/createTask',{method:'POST',headers:headers(this.key),body:JSON.stringify({model:selected.apiModel,input:{prompt:input.prompt,[selected.inputKey]:urls,aspect_ratio:input.aspectRatio??'16:9',...selected.extras}})});
   if(typeof result?.taskId!=='string'||!(/^[\w-]{1,100}$/).test(result.taskId))throw Error('Kie.ai did not return a task ID. Check provider history before trying again.');
   return this.public(this.save({...job,status:'pending',providerJobId:result.taskId}));
  }catch(e){const status=job.status==='submitting'&&!e.definitive?'uncertain':'failed';return this.public(this.save({...job,status,error:String(e.message).slice(0,400)}));}
  finally{this.active.delete(input.id);}
 }
 async refresh(id){
  let job=this.read(id);
  if(job.status==='submitting'&&!this.active.has(id))return this.public(this.save({...job,status:'uncertain',error:'Submission was interrupted. Check Kie.ai history before trying again.'}));
  if(job.kind!=='image'||!job.providerJobId||!['pending','in_progress','downloading'].includes(job.status))return this.public(job);
  if(this.active.has(id))return this.public(job);this.active.set(id,true);
  try{
   const data=await this.request(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(job.providerJobId)}`,{headers:headers(this.key)});
   if(data.state==='fail')return this.public(this.save({...job,status:'failed',error:String(data.failMsg||'Image generation failed.').slice(0,300)}));
   if(['waiting','queuing','generating'].includes(data.state))return this.public(this.save({...job,status:'in_progress'}));
   if(data.state!=='success')throw Error('Kie.ai returned an unknown task state.');
   const result=typeof data.resultJson==='string'?JSON.parse(data.resultJson):data.response;const url=new URL(result?.resultUrls?.[0]);
   if(url.protocol!=='https:'||!/(^|\.)(aiquickdraw\.com|kie\.ai|redpandaai\.co)$/.test(url.hostname))throw Error('Kie.ai returned an unrecognized image address.');
   this.save({...job,status:'downloading'});
   const response=await this.fetchImpl(url.toString(),{redirect:'error',signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Image download failed. Check this existing request again.');
   if(Number(response.headers.get('content-length'))>30e6)throw Error('Generated image is too large.');
   const parts=[];let size=0;for await(const part of response.body){size+=part.length;if(size>30e6)throw Error('Generated image is too large.');parts.push(part);}const bytes=Buffer.concat(parts);
   const mime=bytes[0]===137&&bytes.subarray(1,4).toString()==='PNG'?'image/png':bytes[0]===255&&bytes[1]===216?'image/jpeg':null;
   if(!mime)throw Error('Kie.ai returned an unsupported image.');const file=mime==='image/png'?'output.png':'output.jpg';
   writeFileSync(join(this.dir(id),file),bytes);
   return this.public(this.save({...job,status:'completed',output:{file,mime,bytes:size},usage:{credits:data.creditsConsumed??null}}));
  }finally{this.active.delete(id);}
 }
}
