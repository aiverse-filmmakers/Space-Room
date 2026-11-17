import {useState} from 'react';
import {movementPresets} from './movementCatalogue.ts';
import {mainSubject,movementPolicy} from './movementPresets.ts';
import type {MovementOptions} from './movementPresets.ts';
import type {MovementPreset} from './movementCatalogue.ts';
import type {Pose,Project} from './model.ts';
type Anchor={pose:Pose;target?:string};
type Props={project:Project;selected:string|null;disabled:boolean;capture:()=>Pose|undefined;show:(pose:Pose)=>void;onCreate:(preset:MovementPreset,options:MovementOptions)=>Promise<void>};
const quick=['shot-08','shot-09','shot-14','shot-12','shot-02','dolly-zoom-in'];
export function MovementPresets({project,selected,disabled,capture,show,onCreate}:Props){
 const [id,setId]=useState('shot-08'),[seconds,setSeconds]=useState(6),[amount,setAmount]=useState(1),[start,setStart]=useState<Anchor>(),[end,setEnd]=useState<Anchor>(),[working,setWorking]=useState(false),[library,setLibrary]=useState(true);
 const preset=movementPresets.find(p=>p.id===id)!,hero=mainSubject(project),chosen=project.objects.find(o=>o.id===selected)??hero,policy=movementPolicy(preset);
 const groups=[...new Set(movementPresets.map(p=>p.group))];
 const name=(target?:string)=>project.objects.find(o=>o.id===target)?.name??hero?.name??'No subject';
 function anchor(which:'start'|'end'){const pose=capture();if(pose)(which==='start'?setStart:setEnd)({pose,target:chosen?.id});}
 return <section className="movement-dock" aria-label="Camera movement presets"><fieldset disabled={disabled||working}>
 <div className="movement-dock-heading"><strong>Camera movement presets</strong><span>Target: {chosen?.name??'add a subject'}</span><button type="button" aria-expanded={library} onClick={()=>setLibrary(v=>!v)}>{library?'Hide movement library':'Browse camera movements (39)'}</button></div>
 <div className="movement-quick" aria-label="Quick camera moves">{movementPresets.filter(p=>quick.includes(p.id)||p.id===id).map(p=><button key={p.id} type="button" aria-pressed={id===p.id} onClick={()=>setId(p.id)}>{p.title}</button>)}</div>
 {library&&<div className="movement-library">{groups.map(group=><div key={group}><h3>{group}</h3><div>{movementPresets.filter(p=>p.group===group).map(p=><button type="button" key={p.id} aria-pressed={id===p.id} onClick={()=>setId(p.id)}>{p.title}</button>)}</div></div>)}</div>}
 <div className="movement-captures">{(['start','end'] as const).map(which=>{const anchorPose=which==='start'?start:end;return <div className="movement-capture" key={which}><button type="button" onClick={()=>anchor(which)}>{which==='start'?'Set start here':'Set end here'}</button><span>{anchorPose?`${anchorPose.pose.focal.toFixed(0)} mm · focus: ${name(anchorPose.target)}`:which==='start'?'Current camera when generated':'Automatic end'}</span>{anchorPose&&<><button type="button" aria-label={`View ${which} frame`} onClick={()=>show(anchorPose.pose)}>View</button><button type="button" aria-label={`Clear ${which} frame`} onClick={()=>(which==='start'?setStart:setEnd)(undefined)}>Clear</button></>}</div>;})}</div>
 <div className="movement-generate"><label className="speed-control">Camera speed<span>Slow</span><input aria-label="Preset camera speed" type="range" min={0.25} max={4} step={0.05} value={6/seconds} onChange={e=>setSeconds(6/+e.target.value)}/><span>Fast</span><output>{(6/seconds).toFixed(2)}×</output></label><label>Duration<input aria-label="Movement duration" type="number" min={.5} max={60} step={.5} value={seconds} onChange={e=>setSeconds(+e.target.value)}/>s</label><label>Amount<input aria-label="Movement amount" type="number" min={.1} max={2} step={.1} value={amount} onChange={e=>setAmount(+e.target.value)}/></label><button className="primary" disabled={!hero} onClick={async()=>{const pose=start?.pose??capture();if(!pose)return;setWorking(true);try{const first=start?.target??chosen?.id;await onCreate(preset,{duration:seconds,amount,start:pose,end:end?.pose,startTarget:first,endTarget:preset.kind==='dollyZoom'?first:end?.target??first});}finally{setWorking(false);}}}>{working?'Generating…':'Generate camera movement'}</button></div>
 <p className="movement-help">{policy.hint}{preset.kind==='dollyZoom'&&` Subject: ${name(start?.target??chosen?.id)}.`}{preset.note&&` ${preset.note}`}</p>
 </fieldset></section>;
}
