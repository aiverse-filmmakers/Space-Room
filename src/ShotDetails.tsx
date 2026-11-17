import {FrameImage} from './FrameImage.tsx';
import React,{useRef,useState} from 'react';
import {uid} from './model.ts';import type {Project,ShotCard,Take,Pose,ShotPanel} from './model.ts';
import {panelRoles,panelsFromTake,panelCamera,shotPinned} from './panels.ts';import {cameraLanguage} from './storyboard.ts';import {compareContinuity} from './continuity.ts';
type Props={card:ShotCard;index:number;project:Project;take:Take|null;busy:boolean;current:()=>{pose:Pose;project:Project};render:(cards:ShotCard[])=>Promise<string[]>;onChange:(card:ShotCard)=>void;onView:(card:ShotCard)=>void;onError:(message:string)=>void};
export function ShotDetails(props:Props){
 const {card,index,project,take}=props,[working,setWorking]=useState(false),latest=useRef(props);latest.current=props;
 const others=project.storyboard?.filter(c=>c.id!==card.id)??[],other=others.find(c=>c.id===card.continuity?.comparisonId)??others[0],axisSubjects=card.scene??project.objects;
 const useAxis=!!card.continuity?.axis,axisA=card.continuity?.axis?.[0],axisB=card.continuity?.axis?.[1];
 const report=other?compareContinuity(card,other,project,useAxis?[axisA||axisSubjects[0]?.id,axisB||axisSubjects[1]?.id]:undefined):null,technical=cameraLanguage(card,project),pinned=shotPinned(card);
 async function makePanels(role?:ShotPanel['role']){
  setWorking(true);try{let panels:ShotPanel[];
   if(role){const view=props.current();panels=[{id:uid(),role,pose:view.pose,scene:structuredClone(view.project.objects),room:[...view.project.room],environment:structuredClone(view.project.environment),referenceIds:view.project.references.map(r=>r.id)}];}
   else{if(!take)throw Error('Select a take first.');panels=panelsFromTake({...take,references:take.references??project.references});}
   const images=await props.render(panels.map(p=>panelCamera(p,card.title)));if(latest.current.project!==project)throw Error('Project changed while rendering panels. Try again from the current state.');
   const next=role?[...(card.panels??[]).filter(p=>p.role!==role),...panels.map((p,i)=>({...p,thumbnail:images[i]}))]:panels.map((p,i)=>({...p,thumbnail:images[i]}));
   props.onChange({...card,panels:panelRoles.flatMap(role=>next.filter(p=>p.role===role)),pinned:true});
  }catch(e){props.onError(String(e));}finally{setWorking(false);}
 }
 return <><button className="shot-pin" aria-label={`${pinned?'Unpin':'Pin'} shot ${index+1}`} aria-pressed={pinned} title={pinned?'Pinned against automatic suggestions. Camera updates and notes remain editable.':'Pin to preserve framing when suggestions refresh.'} onClick={()=>props.onChange({...card,pinned:!pinned})}>{pinned?'Pinned framing':'Pin framing'}</button>
 <details className="shot-workflow"><summary>Panels, camera & continuity</summary><p>{technical.technical}</p><p>{technical.staging}</p>
 <strong>Shot {String(index+1).padStart(2,'0')} · action panels</strong><p>Start, middle and end belong to this shot. The six-shot overview stays unchanged.</p>
 <button disabled={props.busy||working||!take} onClick={()=>makePanels()}>{working?'Rendering panels…':take?'Create panels from active take':'Select a take to create panels'}</button>{take&&<small>Active take: {take.name} · {take.duration.toFixed(2)}s</small>}
 <div className="shot-panel-grid">{panelRoles.map((role,i)=>{const panel=card.panels?.find(p=>p.role===role);return <div key={role}><strong>{index+1}{String.fromCharCode(65+i)} · {role}</strong>{panel&&<FrameImage frame={panelCamera(panel,`${card.title} · ${role}`)}><button className="panel-image" aria-label={`View shot ${index+1} ${role} panel`} onClick={()=>props.onView(panelCamera(panel,`${card.title} · ${role}`))}><img src={panel.thumbnail} alt={`${card.title} ${role}`}/></button></FrameImage>}{panel&&<small>{panel.time!==undefined?`${panel.time.toFixed(2)}s · ${panel.takeName??'take'}`:'Manually framed'}</small>}<button disabled={props.busy||working} onClick={()=>makePanels(role)}>{panel?'Replace with current view':'Capture current view'}</button></div>;})}</div>
 {pinned&&!!card.panels?.length&&<p>Pinned panels stay saved when automatic suggestions refresh. Update them explicitly from the camera or active take.</p>}
 <strong>Continuity review</strong><p>Compare saved sets. Reverse angles can be intentional; these cues never change your framing.</p>
 <label>Compare with<select aria-label={`Shot ${index+1} continuity comparison`} value={other?.id??''} onChange={e=>props.onChange({...card,continuity:{...card.continuity,comparisonId:e.target.value}})}>{others.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
 <label><input type="checkbox" checked={useAxis} onChange={e=>props.onChange({...card,continuity:{...card.continuity,axis:e.target.checked?[axisSubjects[0]?.id??'',axisSubjects[1]?.id??'']:undefined}})}/>Check action axis / screen direction</label>
 {useAxis&&<div className="axis-fields">{['A','B'].map((label,i)=><label key={label}>Subject {label}<select aria-label={`Shot ${index+1} axis ${label}`} value={(i?axisB:axisA)||axisSubjects[i]?.id||''} onChange={e=>{const axis:[string,string]=[axisA??'',axisB??''];axis[i]=e.target.value;props.onChange({...card,continuity:{...card.continuity,axis}});}}>{axisSubjects.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>)}</div>}
 {report&&<div className="continuity-report" role="status">{report.issues.length>0?<ul>{report.issues.map((issue,i)=><li key={i}>{issue.message}</li>)}</ul>:!report.unknown.length&&<p>No set or appearance-reference differences above the review thresholds.</p>}{report.unknown.map((message,i)=><p key={i}>{message}</p>)}</div>}
 <label>Intentional changes / continuity notes<textarea aria-label={`Shot ${index+1} continuity notes`} maxLength={2000} value={card.continuityNote??''} onChange={e=>props.onChange({...card,continuityNote:e.target.value})}/></label>
 </details></>;
}
