import {facingDescription} from './facing.ts';
import React,{useEffect,useRef,useState} from 'react';
import {download,sampleTake,uid} from './model.ts';
import type {GenerationLink,Project,Take,Pose} from './model.ts';
import {shotManifest} from './shot.ts';
import {apiFetch} from './apiClient.ts';
import {RemoteMedia} from './RemoteMedia.tsx';
import {readArchivedJob,readArchivedPackage} from './workspace.ts';
type Job={id:string;kind:'image'|'video';name:string;created:string;status:string;model?:string;prompt?:string;providerJobId?:string;error?:string;usage?:{cost?:number};output?:{file:string;mime:string;bytes:number};context?:{takeId?:string}};
type Capabilities={enabled:boolean;image:{model:string;provider:string;maxReferences:number;aspectRatios:string[];pricing:{billable:string;cost_usd:number;unit:string}[]};video:{model:string;durations:number[];aspectRatios:string[];frameTypes:string[];pricing:Record<string,string>};limitations:string[]};
type Props={projectId:string;project:Project;take:Take|null;enabled:boolean;render:(take:Take,pose:Pose)=>Promise<string>;onCreate:(job:GenerationLink)=>void;onStatus:(id:string,status:string,error?:string)=>void};
const pending=new Set(['pending','in_progress','downloading','submitting']);
async function json(url:string,init?:RequestInit){const r=await apiFetch(url,init),data=await r.json();if(!r.ok){const error=Object.assign(Error(data.error||'Generation request failed.'),{definitive:r.status>=400&&r.status<500});throw error;}return data;}
export function GenerationPanel(props:Props){
 const [caps,setCaps]=useState<Capabilities|null>(null),[jobs,setJobs]=useState<Record<string,Job>>({}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[prompt,setPrompt]=useState(''),[frame,setFrame]=useState('first'),[first,setFirst]=useState(''),[last,setLast]=useState(''),[duration,setDuration]=useState(5);
 const latest=useRef(props),jobRef=useRef(jobs),alive=useRef(true),autoPrompt=useRef({id:'',text:'',duration:0});latest.current=props;jobRef.current=jobs;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const ids=(props.project.generations??[]).map(g=>g.id).join(',');
 function receive(job:Job){setJobs(p=>({...p,[job.id]:job}));latest.current.onStatus(job.id,job.status,job.error);}
 async function refresh(id:string,provider=false){try{const job=await json(`/api/generation/jobs/${id}${provider?'/refresh':''}`,provider?{method:'POST'}:undefined);receive(job);}catch(e){const archived=await readArchivedJob<Job>(latest.current.projectId,id);if(archived){receive(archived);return;}setJobs(p=>({...p,[id]:{...(p[id]??latest.current.project.generations?.find(g=>g.id===id))!,id,status:'unavailable',error:String(e)}}));}}
 useEffect(()=>{for(const id of ids.split(',').filter(Boolean))void refresh(id);const timer=setInterval(()=>{for(const j of Object.values(jobRef.current))if(pending.has(j.status))void refresh(j.id,true);},30000);return()=>clearInterval(timer);},[ids]);
 useEffect(()=>{const next=props.take?shotManifest(props.take,props.take.references??props.project.references,'',props.project.frameFormat).motionDescription:'',previous=autoPrompt.current,id=props.take?.id??'',duration=props.take?.duration??0;setPrompt(value=>id!==previous.id||value===previous.text?next:value);if(id!==previous.id||duration!==previous.duration)setDuration(props.take?Math.round(props.take.duration):5);autoPrompt.current={id,text:next,duration};},[props.take,props.project.frameFormat]);
 async function check(){setBusy(true);setError('');try{setCaps(await json('/api/generation/capabilities'));}catch(e){setError(String(e));}finally{setBusy(false);}}
 async function generate(kind:'image'|'video'){if(!window.confirm('This submits a paid AI generation request to your provider. Continue?'))return;
  if(!props.enabled||!caps?.enabled){setError('Paid generation is disabled.');return;}if(!props.take){setError('Select a take first.');return;}
  const take=props.take;setBusy(true);setError('');let id:string|undefined;
  try{
   let inputs:Record<string,unknown>;const references=take.references??props.project.references;
   if(kind==='image'){
    if(!references.length)throw Error('Add an original appearance reference before generating styled frames.');const pose=sampleTake(take,frame==='first'?0:take.duration),composition=await props.render(take,pose);
    inputs={appearance:references.map(r=>r.data),composition,prompt:`${prompt}\nCreate a finished cinematic still from the ${frame==='first'?'starting':'ending'} camera of this shot. ${pose.focal} mm lens, camera height ${pose.position[1].toFixed(2)} m, focus distance ${pose.focus.toFixed(2)} m. Preserve the original references' appearance and lighting. Required subject directions: ${facingDescription(take.scene,pose)}`,context:{facingGuides:props.project.facingGuides!==false,takeId:take.id,takeName:take.name,frame,pose,referenceIds:references.map(r=>r.id),scene:take.scene,environment:take.environment}};
   }else{
    if(!first)throw Error('Choose a completed styled start image.');inputs={firstFrameJob:first,lastFrameJob:last||undefined,duration,prompt:`${prompt}\n\nCamera reference: ${shotManifest(take,references,'',props.project.frameFormat).motionDescription} Interpret the movement with cinematic acceleration and braking. Preserve the styled frames’ appearance.`,context:{takeId:take.id,takeName:take.name,recordedDuration:take.duration,generationDuration:duration,motionDescription:shotManifest(take,references,'',props.project.frameFormat).motionDescription,firstFrameJob:first,lastFrameJob:last||undefined}};
   }
   if(!alive.current||latest.current.project!==props.project)throw Error('Project changed while preparing this shot. No generation was submitted.');
   id=uid();const name=`${take.name} · ${kind==='image'?frame+' frame':'AI video'}`.slice(0,120),created=new Date().toISOString();props.onCreate({id,kind,name,created,takeId:take.id,status:'submitting'});
   setJobs(p=>({...p,[id!]:{id:id!,kind,name,created,status:'submitting'}}));
   receive(await json('/api/generation/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,kind,name,aspectRatio:props.project.frameFormat??'16:9',...inputs})}));
  }catch(e){setError(String(e));if(id){setJobs(p=>({...p,[id!]:{...p[id!],status:(e as {definitive?:boolean}).definitive?'failed':'uncertain',error:String(e)}}));props.onStatus(id,(e as {definitive?:boolean}).definitive?'failed':'uncertain',String(e));}}finally{setBusy(false);}
 }
 async function packageJob(id:string){setError('');try{const r=await apiFetch(`/api/generation/jobs/${id}/package`);if(!r.ok)throw Error('Could not download this job package.');download(`scene-room-result-${id}.zip`,await r.blob(),'application/zip');}catch(e){const saved=await readArchivedPackage(props.projectId,id);if(saved)download(`scene-room-result-${id}.zip`,saved,'application/zip');else setError(String(e));}}
 const format=props.project.frameFormat??'16:9',imageFits=(caps?.image.aspectRatios??['16:9']).includes(format),videoFits=(caps?.video.aspectRatios??['16:9']).includes(format);
 const styled=(props.project.generations??[]).filter(g=>g.kind==='image'&&jobs[g.id]?.status==='completed');
 return <details className="generation-panel"><summary>Generate AI shot</summary><p className="field-hint">Style the start/end compositions using the original look, then animate the chosen styled frames. The camera path is guidance, not an exact model control.</p>
 <p className="field-hint">{props.enabled?'Generation enabled on this server. Requests use OpenRouter.':'Paid generation is off. Model support can be checked without generating.'}</p>
 <button disabled={busy} onClick={check}>{busy?'Working…':caps?'Refresh model support':'Check model support'}</button>
 {caps&&<><p className="field-hint">Still model: {caps.image.model}<br/>Video model: {caps.video.model}</p><p className="field-hint">Image pricing: {caps.image.pricing.map(p=>`$${p.cost_usd} / ${p.unit} (${p.billable})`).join('; ')||'not published'}. Video pricing depends on output tokens and settings; exact usage is saved with the result.</p>
 <p className="field-hint">Frame format: {format}. {!imageFits&&'The still model does not support this format. '}{!videoFits&&'The video model does not support this format. '}Local exports keep your chosen format.</p><label>Shot direction<textarea aria-label="Generation direction" maxLength={6500} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe the intended cinematic shot…"/></label>
 <label>Composition<select aria-label="Styled frame position" value={frame} onChange={e=>setFrame(e.target.value)}><option value="first">Take start</option><option value="last">Take end</option></select></label>
 <button disabled={!props.enabled||!caps.enabled||!imageFits||!props.take||busy||!prompt.trim()} onClick={()=>generate('image')}>Generate styled frame</button>
 <label>Styled start<select aria-label="Styled video start" value={first} onChange={e=>setFirst(e.target.value)}><option value="">Choose an image result</option>{styled.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
 <label>Styled end<select aria-label="Styled video end" disabled={!caps.video.frameTypes.includes('last_frame')} value={last} onChange={e=>setLast(e.target.value)}><option value="">No fixed ending</option>{styled.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
 <label>Video duration<select aria-label="Generated video duration" value={duration} onChange={e=>setDuration(+e.target.value)}>{!caps.video.durations.includes(duration)&&<option value={duration} disabled>{duration}s unsupported</option>}{caps.video.durations.map(d=><option key={d} value={d}>{d}s</option>)}</select></label>
 {props.take&&duration!==props.take.duration&&<p className="field-hint">Video length differs from the take ({props.take.duration.toFixed(2)}s). The motion description will be interpreted at the selected length.</p>}
 <button disabled={!props.enabled||!caps.enabled||!videoFits||!props.take||busy||!first||!prompt.trim()||!caps.video.durations.includes(duration)} onClick={()=>generate('video')}>Generate video from styled frames</button></>}
 {error&&<p role="alert" className="field-hint">{error}</p>}
 {(props.project.generations??[]).length>0&&<div className="generation-results"><h3>Shot results</h3><p className="field-hint">Results stay on this local server. Download each result package alongside your project when moving machines.</p>{[...(props.project.generations??[])].reverse().map(link=>{const job=jobs[link.id];return <article key={link.id}><strong>{link.name}</strong><small>{job?.status??link.status??'Loading record…'}</small>{job?.output&&(job.kind==='image'?<RemoteMedia projectId={props.projectId} path={`/api/generation/jobs/${link.id}/content`} alt={link.name}/>:<RemoteMedia projectId={props.projectId} path={`/api/generation/jobs/${link.id}/content`} kind="video" alt={link.name}/>)}{job?.error&&<p>{job.error}</p>}{job?.status==='uncertain'&&<p>Check provider history before a new request. This job will not resubmit automatically.</p>}{job?.usage?.cost!==undefined&&<small>Reported cost: ${job.usage.cost}</small>}<button onClick={()=>refresh(link.id,true)}>Refresh existing job</button><button disabled={!job||job.status==='unavailable'} onClick={()=>packageJob(link.id)}>Download result package</button></article>;})}</div>}
 </details>;
}
