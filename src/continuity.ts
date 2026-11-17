import {Quaternion,Euler,Vector3} from 'three';
import type {Project,ShotCard,SceneObject,Environment} from './model.ts';
export const defaultLighting={position:[-4,7,3] as [number,number,number],color:'#fff1d5',intensity:4.2};
export type ContinuityIssue={kind:'position'|'orientation'|'scale'|'identity'|'lighting'|'environment'|'references'|'axis';message:string;subjectId?:string};
const quaternion=(o:SceneObject)=>new Quaternion().setFromEuler(new Euler(o.orientation?.[0]??0,o.rotation+(o.orientation?.[1]??0),o.orientation?.[2]??0,o.kind==='flower'?'YXZ':'XYZ'));
export function compareContinuity(a:ShotCard,b:ShotCard,project:Project,axis?:[string,string]){
 const issues:ContinuityIssue[]=[],unknown:string[]=[];
 if(!a.scene||!b.scene)unknown.push('One or both shots have no saved set snapshot. Geography and lighting cannot be compared reliably.');
 else{
  const first=new Map(a.scene.map(o=>[o.id,o])),second=new Map(b.scene.map(o=>[o.id,o]));
  for(const o of a.scene){const next=second.get(o.id);if(!next){issues.push({kind:'identity',subjectId:o.id,message:`${o.name} is absent from the second set snapshot.`});continue;}
   const distance=new Vector3(...o.position).distanceTo(new Vector3(...next.position));if(distance>.05)issues.push({kind:'position',subjectId:o.id,message:`${o.name} moved ${distance.toFixed(2)} m between set snapshots.`});
   if(o.kind!==next.kind||o.color!==next.color)issues.push({kind:'identity',subjectId:o.id,message:`${o.name} changed asset type or surface colour.`});
   if(o.size.some((v,i)=>Math.abs(v-next.size[i])/Math.max(.01,v)>.02))issues.push({kind:'scale',subjectId:o.id,message:`${o.name} changed dimensions by more than 2%.`});
   const angle=quaternion(o).angleTo(quaternion(next))*180/Math.PI;if(angle>5)issues.push({kind:'orientation',subjectId:o.id,message:`${o.name} changed facing or tilt by ${angle.toFixed(0)}°.`});
  }
  for(const o of b.scene)if(!first.has(o.id))issues.push({kind:'identity',subjectId:o.id,message:`${o.name} was added in the second set snapshot.`});
  const envA=a.environment,envB=b.environment;
  if((envA?.kind??'interior')!==(envB?.kind??'interior')||envA?.sky!==envB?.sky||envA?.ground!==envB?.ground||envA?.terrain!==envB?.terrain)issues.push({kind:'environment',message:'Set environment, sky, ground or terrain changed.'});
  const light=(e?:Environment)=>e?.lighting??defaultLighting,la=light(envA),lb=light(envB),angle=new Vector3(...la.position).angleTo(new Vector3(...lb.position))*180/Math.PI;
  if(angle>5||la.color.toLowerCase()!==lb.color.toLowerCase()||Math.abs(la.intensity-lb.intensity)>.1)issues.push({kind:'lighting',message:'World-space light direction, colour or intensity changed.'});
  if(axis){const x=first.get(axis[0]),y=first.get(axis[1]);if(!x||!y||!second.has(axis[0])||!second.has(axis[1])||axis[0]===axis[1])unknown.push('Choose two distinct subjects present in both shots to check the action axis.');else{
   const origin=new Vector3(...x.position),line=new Vector3(...y.position).sub(origin);line.y=0;if(line.length()<.1)unknown.push('Action-axis subjects are too close to establish screen direction.');else{
    line.normalize();const side=(c:ShotCard)=>new Vector3().crossVectors(line,new Vector3(...c.pose.position).sub(origin)).y,sa=side(a),sb=side(b);
    if(Math.abs(sa)<.05||Math.abs(sb)<.05)unknown.push('A camera lies on the action axis; screen direction is ambiguous.');else if(sa*sb<0)issues.push({kind:'axis',message:'These camera positions cross the selected action axis. Check screen direction; the reverse may be intentional.'});
   }
  }}
 }
 const refsA=[...(a.referenceIds??project.references.map(r=>r.id))].sort(),refsB=[...(b.referenceIds??project.references.map(r=>r.id))].sort();if(JSON.stringify(refsA)!==JSON.stringify(refsB))issues.push({kind:'references',message:'Appearance-reference selection changed between shots.'});
 if([...refsA,...refsB].some(id=>!project.references.some(r=>r.id===id)))unknown.push('A shot refers to an appearance image missing from the current project.');
 return {issues,unknown,thresholds:{positionMetres:.05,orientationDegrees:5,relativeScale:.02},note:'These are review cues, not errors to automatically correct. The six coverage ideas are not assumed to be an edit sequence.'};
}
