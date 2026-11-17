import {mkdirSync,readFileSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {zipSync,strToU8} from 'fflate';
import {createHash} from 'node:crypto';
const BASE='https://openrouter.ai/api/v1';
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
const imageData=s=>typeof s==='string'&&s.length<18e6&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
const imagePart=url=>({type:'image_url',image_url:{url}});
export function validateGeneration(input){
 if(!input||!validId(input.id)||!['image','video'].includes(input.kind)||typeof input.prompt!=='string'||!input.prompt.trim()||input.prompt.length>8000||typeof input.name!=='string'||input.name.length>120)throw Error('Invalid generation request.');
 if(input.model!==undefined&&(typeof input.model!=='string'||!/^[a-zA-Z0-9][-a-zA-Z0-9_.]*\/[a-zA-Z0-9][-a-zA-Z0-9_.:]*$/.test(input.model)))throw Error('Invalid image model.');
 if(input.aspectRatio!==undefined&&(typeof input.aspectRatio!=='string'||input.aspectRatio.length>20||!/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(input.aspectRatio)||input.aspectRatio.split(':').some(n=>+n<=0)))throw Error('Invalid frame format.');
 if(input.kind==='image'){
  if(!Array.isArray(input.appearance)||input.appearance.length<1||input.appearance.length>8||!input.appearance.every(imageData)||!imageData(input.composition))throw Error('Provide original appearance references and one rough composition image.');
 }else if(!validId(input.firstFrameJob)||input.lastFrameJob!==undefined&&!validId(input.lastFrameJob)||!Number.isInteger(input.duration)||input.duration<1||input.duration>30)throw Error('Choose completed styled frames and a supported integer video duration.');
 if(input.context!==undefined&&JSON.stringify(input.context).length>50000)throw Error('Shot context is too large.');
 return input;
}
export function imagePayload(input,model,endpoint){
 const caps=endpoint.supported_parameters,refs=[...input.appearance,input.composition];
 if(!caps?.input_references||caps.input_references.max<refs.length)throw Error('This endpoint cannot accept all appearance and composition references.');
 if(!caps.aspect_ratio?.values?.includes(input.aspectRatio??'16:9'))throw Error('This image endpoint does not support the shot aspect ratio.');
 const provider=endpoint.provider_tag;if(typeof provider!=='string'||!provider)throw Error('Image endpoint cannot be pinned safely.');
 return {model,prompt:`${input.prompt}\n\nReference roles: images 1–${input.appearance.length} supply the original appearance, identity, materials and lighting. Image ${refs.length} is a rough 3D composition guide only: follow its camera viewpoint and subject placement, replacing all proxy geometry with the original cinematic appearance. Do not imitate the blockout's simple shading. Hidden surfaces are inferred.${input.context?.facingGuides?' Thin amber direction arrows in the composition guide specify required face/head or car-front direction. Follow their direction, preserving subject positions and identity. They are annotations only: remove every arrow and handle from the finished image. Do not turn subjects to face the viewer unless their guide arrow points toward the viewer.':''}`,input_references:refs.map(imagePart),aspect_ratio:input.aspectRatio??'16:9',...(caps.n?{n:1}:{}),provider:{only:[provider],allow_fallbacks:false}};
}
export function videoPayload(input,model,capabilities,first,last){
 if(!capabilities.supported_durations?.includes(input.duration)||!capabilities.supported_aspect_ratios?.includes(input.aspectRatio??'16:9')||!capabilities.supported_resolutions?.includes('720p'))throw Error('This video model does not support the requested duration, aspect ratio or resolution.');
 if(!capabilities.supported_frame_images?.includes('first_frame')||last&&!capabilities.supported_frame_images?.includes('last_frame'))throw Error('This video model does not support the selected frame controls.');
 return {model,prompt:input.prompt,duration:input.duration,aspect_ratio:input.aspectRatio??'16:9',resolution:'720p',generate_audio:false,frame_images:[{...imagePart(first),frame_type:'first_frame'},...(last?[{...imagePart(last),frame_type:'last_frame'}]:[])]};
}
const mimeFor=b=>b[0]===137&&b.subarray(1,4).toString()==='PNG'?'image/png':b[0]===255&&b[1]===216?'image/jpeg':b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'?'image/webp':null;
export class GenerationService{
 constructor({root=fileURLToPath(new URL('./artifacts/generation/',import.meta.url)),enabled=false,key=null,fetchImpl=fetch,imageModel=process.env.SCENE_ROOM_IMAGE_MODEL||'google/gemini-nano-banana-2.1',videoModel=process.env.SCENE_ROOM_VIDEO_MODEL||'bytedance/seedance-2.0-mini'}={}){Object.assign(this,{root,enabled,key,fetchImpl,imageModel,videoModel});this.active=new Map();this.metadata=null;}
 dir(id){if(!validId(id))throw Error('Invalid job ID');return join(this.root,id);}
 save(job){const dir=this.dir(job.id);mkdirSync(dir,{recursive:true});const file=join(dir,'job.json');writeFileSync(file+'.tmp',JSON.stringify(job,null,2));renameSync(file+'.tmp',file);return job;}
 read(id){try{const job=JSON.parse(readFileSync(join(this.dir(id),'job.json'),'utf8'));if(job.id!==id||job.output&&!/^output\.(png|jpg|webp|mp4)$/.test(job.output.file)||!Array.isArray(job.submitted?.references)||job.submitted.references.some(r=>!/^input-\d+\.(png|jpg|webp)$/.test(r.file)))throw Error();return job;}catch{throw Error('Generation job is not available on this server. Keep your downloaded result package.');}}
 public(job){const {requestHash,...safe}=job;return safe;}
 async json(url,options={}){const r=await this.fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(180000)});if(!r.ok){let error;try{error=await r.json();}catch{}const failure=Error(`OpenRouter request failed (${r.status}): ${String(error?.error?.message||error?.error||'Provider unavailable').slice(0,300)}`);failure.definitive=true;throw failure;}return r.json();}
 headers(){if(!this.key)throw Error('OpenRouter is not configured.');return {Authorization:`Bearer ${this.key}`,'Content-Type':'application/json'};}
 async capabilities(){
  if(this.metadata&&Date.now()-this.metadata.at<300000)return this.metadata.value;
  const [images,videos]=await Promise.all([this.json(`${BASE}/images/models/${this.imageModel}/endpoints`),this.json(`${BASE}/videos/models`)]);
  const endpoint=images.endpoints?.find(e=>e.provider_tag&&e.supported_parameters?.input_references?.max>=2&&e.supported_parameters?.aspect_ratio?.values?.includes('16:9'));
  const video=videos.data?.find(m=>m.id===this.videoModel);
  if(!endpoint||!video)throw Error('Configured generation models or their reference capabilities are unavailable.');
  const value={enabled:this.enabled&&!!this.key,image:{model:this.imageModel,provider:endpoint.provider_tag,maxReferences:endpoint.supported_parameters.input_references.max,aspectRatios:endpoint.supported_parameters.aspect_ratio.values,pricing:endpoint.pricing??[],endpoint},video:{model:this.videoModel,durations:video.supported_durations,aspectRatios:video.supported_aspect_ratios,frameTypes:video.supported_frame_images??[],pricing:video.pricing_skus??{},capabilities:video},limitations:['Image appearance and composition are separate input roles, not guaranteed conditioning.','Video uses styled frames, not the rough blockout or arbitrary camera JSON.','Motion descriptions guide the model; exact recorded trajectory is not guaranteed.']};this.metadata={at:Date.now(),value};return value;
 }
 async imageModels(){
  if(this.catalogue&&Date.now()-this.catalogue.at<300000)return this.catalogue.value;
  const data=await this.json(`${BASE}/images/models`,this.key?{headers:this.headers()}:{});
  const models=(data.data??[]).filter(m=>/^[a-zA-Z0-9][-a-zA-Z0-9_.]*\/[a-zA-Z0-9][-a-zA-Z0-9_.:]*$/.test(m.id)&&m.supported_parameters?.input_references?.max>=2&&Array.isArray(m.supported_parameters?.aspect_ratio?.values)).map(m=>({id:m.id,name:m.name||m.id,maxReferences:m.supported_parameters.input_references.max,aspectRatios:m.supported_parameters.aspect_ratio.values}));
  const value={enabled:this.enabled&&!!this.key,defaultModel:this.imageModel,models};this.catalogue={at:Date.now(),value};return value;
 }
 async imageEndpoint(model,input){
  const catalogue=await this.imageModels();if(!catalogue.models.some(m=>m.id===model))throw Error('Selected image model is not available with reference support.');
  const data=await this.json(`${BASE}/images/models/${model}/endpoints`,this.key?{headers:this.headers()}:{});
  const endpoint=data.endpoints?.find(e=>e.provider_tag&&e.supported_parameters?.input_references?.max>=input.appearance.length+1&&e.supported_parameters?.aspect_ratio?.values?.includes(input.aspectRatio??'16:9'));
  if(!endpoint)throw Error('Selected model cannot accept this frame format and all references.');return endpoint;
 }
 async submit(raw){
  if(!this.enabled)throw Error('Paid generation is disabled. Your scene and takes are unchanged.');
  const input=validateGeneration(raw),hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
  if(existsSync(join(this.dir(input.id),'job.json'))){const prior=this.read(input.id);if(prior.requestHash!==hash)throw Error('This request ID already belongs to a different generation.');return this.public(prior);}
  if(this.active.has(input.id))throw Error('This generation is already being submitted.');
  this.active.set(input.id,true);let job;
  try{
   this.headers();let payload;
   if(input.kind==='image'){const model=input.model??this.imageModel;const endpoint=input.model?await this.imageEndpoint(model,input):(await this.capabilities()).image.endpoint;payload=imagePayload(input,model,endpoint);}
   else{
    const first=this.read(input.firstFrameJob),last=input.lastFrameJob?this.read(input.lastFrameJob):null;
    if([first,...last?[last]:[]].some(j=>j.kind!=='image'||j.status!=='completed'||!j.output))throw Error('Video frames must be completed styled image jobs.');
    if([first,...last?[last]:[]].some(j=>(j.submitted?.aspect_ratio??'16:9')!==(input.aspectRatio??'16:9')))throw Error('Styled frames use a different frame format. Generate matching frames first.');
    const data=j=>`data:${j.output.mime};base64,${readFileSync(join(this.dir(j.id),j.output.file)).toString('base64')}`;
    payload=videoPayload(input,this.videoModel,(await this.capabilities()).video.capabilities,data(first),last?data(last):undefined);
   }
   job={id:input.id,kind:input.kind,name:input.name,created:new Date().toISOString(),status:'submitting',model:payload.model,prompt:payload.prompt,context:input.context??{},requestHash:hash,submitted:{aspect_ratio:payload.aspect_ratio,duration:payload.duration,provider:payload.provider,frameJobs:input.kind==='video'?[input.firstFrameJob,...input.lastFrameJob?[input.lastFrameJob]:[]]:undefined,references:[]}};
   this.save(job);
   // Save exact submitted image inputs for review/recovery; no credential or signed URLs.
   const refs=payload.input_references??payload.frame_images;for(let i=0;i<refs.length;i++){const data=refs[i].image_url.url,comma=data.indexOf(','),mime=data.slice(5,data.indexOf(';')),file=`input-${i+1}.${mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png'}`;writeFileSync(join(this.dir(job.id),file),Buffer.from(data.slice(comma+1),'base64'));job.submitted.references.push({file,mime,role:input.kind==='image'?(i<input.appearance.length?'appearance':'composition'):refs[i].frame_type});}
   this.save(job);
   const data=await this.json(`${BASE}/${input.kind==='image'?'images':'videos'}`,{method:'POST',headers:this.headers(),body:JSON.stringify(payload)});
   if(input.kind==='image'){
    const raw=data.data?.[0]?.b64_json;if(typeof raw!=='string'||raw.length>64e6)throw Error('Image response is missing or exceeds the supported size.');const bytes=Buffer.from(raw,'base64'),mime=mimeFor(bytes);if(!mime)throw Error('Provider returned an unsupported image format.');const file='output.'+(mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png');writeFileSync(join(this.dir(job.id),file),bytes);job={...job,status:'completed',output:{file,mime,bytes:bytes.length},usage:data.usage??null};
   }else{
    if(!validId(data.id))throw Error('Provider returned no valid video job ID. Do not resubmit blindly.');job={...job,providerJobId:data.id,status:'pending'};
   }
   return this.public(this.save(job));
  }catch(error){
   if(job){job={...job,status:job.status==='submitting'&&!error.definitive?'uncertain':'failed',error:String(error.message)};this.save(job);return this.public(job);}throw error;
  }finally{this.active.delete(input.id);}
 }
 async refresh(id){
  let job=this.read(id);if(job.status==='submitting'&&!this.active.has(id))return this.public(this.save({...job,status:'uncertain',error:'The server stopped during submission. Check provider history before creating another paid request.'}));
  if(job.kind!=='video'||!job.providerJobId||!['pending','in_progress','downloading'].includes(job.status))return this.public(job);
  if(this.active.has(id))return this.public(job);this.active.set(id,true);try{
  const data=await this.json(`${BASE}/videos/${encodeURIComponent(job.providerJobId)}`,{headers:this.headers()});
  if(!['pending','in_progress','completed','failed','cancelled','expired'].includes(data.status))throw Error('Provider returned an unknown job state. The saved job ID is retained.');
  if(data.status==='completed'){
   this.save({...job,status:'downloading',usage:data.usage??null});
   const response=await this.fetchImpl(`${BASE}/videos/${encodeURIComponent(job.providerJobId)}/content?index=0`,{headers:{Authorization:`Bearer ${this.key}`},redirect:'error',signal:AbortSignal.timeout(180000)});
   if(!response.ok)throw Error('Video is complete but download failed. Refresh this job to retry downloading; do not submit a new job.');
   if(Number(response.headers.get('content-length'))>150e6)throw Error('Generated video is too large to save locally.');const parts=[];let size=0;for await(const part of response.body){size+=part.length;if(size>150e6)throw Error('Generated video exceeds 150 MB.');parts.push(part);}const bytes=Buffer.concat(parts);if(bytes.subarray(4,8).toString()!=='ftyp')throw Error('Provider content is not a supported MP4.');writeFileSync(join(this.dir(job.id),'output.mp4'),bytes);job={...job,status:'completed',usage:data.usage??null,output:{file:'output.mp4',mime:'video/mp4',bytes:size}};
  }else job={...job,status:data.status,usage:data.usage??null,error:data.error?String(data.error).slice(0,1000):undefined};
  return this.public(this.save(job));
  }finally{this.active.delete(id);}
 }
 package(id){const job=this.read(id),files={'job.json':strToU8(JSON.stringify(this.public(job),null,2))};for(const ref of job.submitted.references)files[ref.file]=readFileSync(join(this.dir(id),ref.file));if(job.output)files[job.output.file]=readFileSync(join(this.dir(id),job.output.file));files['README.txt']=strToU8('Scene Room generation record. Input roles, prompt, model, settings, take context, job state and reported usage are in job.json. Input images are the exact submitted references. No credential or signed content URL is included. Missing output indicates an unfinished or failed job.');return zipSync(files,{level:0});}
 content(id){const job=this.read(id);if(job.status!=='completed'||!job.output)throw Error('No completed output is available.');return {job:this.public(job),bytes:readFileSync(join(this.dir(id),job.output.file)),mime:job.output.mime};}
}
