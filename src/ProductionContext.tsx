import React from 'react';
import {newProduction,productionRevision} from './production.ts';
import type {Project} from './model.ts';
import type {Production} from './production.ts';
export function ProductionContext({project,onChange}:{project:Project;onChange:(p:Project)=>void}){
 const context=project.production??newProduction(project);
 const update=(patch:Partial<Production>)=>onChange({...project,production:{...context,...patch}});
 const stale=project.storyboard?.some(s=>s.contextRevision&&s.contextRevision!==productionRevision(project));
 return <details className="production-context"><summary>Script & references</summary>
 <label>Script title<input aria-label="Script title" maxLength={200} value={context.script.title} onChange={e=>update({script:{...context.script,title:e.target.value,revision:context.script.revision+1}})}/></label>
 <label>Script / scene notes<textarea aria-label="Script / scene notes" maxLength={200000} value={context.script.text} onChange={e=>update({script:{...context.script,text:e.target.value,revision:context.script.revision+1}})}/></label>
 <label>Story source<select aria-label="Story source" value={context.policy??'pending'} onChange={e=>update({policy:e.target.value as Production['policy']})}><option value="pending">Await script or choice</option><option value="script">Use script</option><option value="improvise">Allow creative exploration</option></select></label>
 {(['sourceId','endId'] as const).map((key,i)=><label key={key}>{i?'Ending reference':'Hero / opening reference'}<select aria-label={i?'Ending reference':'Hero / opening reference'} value={context[key]??''} onChange={e=>update({[key]:e.target.value})}><option value="">{i?'Not selected':'First reference'}</option>{project.references.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>)}
 <p>Link appearance references to named subjects. The 3D set supplies composition.</p>
 {project.objects.map(o=>{const entity=context.entities.find(e=>e.objectIds.includes(o.id));return <label key={o.id}>{o.name}<select aria-label={`Appearance reference for ${o.name}`} value={entity?.referenceIds[0]??''} onChange={e=>update({entities:[...context.entities.filter(v=>v!==entity),{id:entity?.id??crypto.randomUUID(),role:o.kind==='person'?'character':'prop',name:o.name,description:o.description??'',objectIds:[o.id],referenceIds:e.target.value?[e.target.value]:[]}]})}><option value="">Scene references</option>{project.references.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>;})}
 {stale&&<p role="status">Script or references changed since saved shots were approved. Review them; their framing is preserved.</p>}
 </details>;
}
