import {Euler,PerspectiveCamera,Quaternion,Vector3} from 'three';
import {frameSpec} from './formats.ts';
import {subjectFraming} from './subjectFraming.ts';
import {parseProject,uid} from './model.ts';
import type {Pose,Project,SceneObject,Take} from './model.ts';
import type {MovementPreset} from './movementCatalogue.ts';
export type MovementOptions={duration:number;amount:number;start?:Pose;end?:Pose;startTarget?:string;endTarget?:string};
export function mainSubject(project:Project){return project.objects.find(o=>o.kind==='car')??project.objects.find(o=>o.kind==='person')??project.objects[0];}
function centre(o:SceneObject){return new Vector3(...o.position).add(new Vector3(0,['car','person','flower'].includes(o.kind)?o.size[1]*.5:0,0));}
function look(position:Vector3,target:Vector3){const c=new PerspectiveCamera();c.position.copy(position);c.lookAt(target);return c.quaternion.clone();}
const ease=(u:number)=>u*u*(3-2*u);
/** Bake deterministic motion into the existing planned-take evaluator; no provider or new playback path. */
export function movementPolicy(preset:MovementPreset){
 const fixed=['static','pan','tilt','zoom','focus'].includes(preset.kind);
 return {fixed,hint:preset.kind==='static'?'Static holds the start position, angle and lens.':preset.kind==='pan'?'Pan stays at the start position; the end capture sets its horizontal angle and focus.':preset.kind==='tilt'?'Tilt stays at the start position; the end capture sets its vertical angle and focus.':preset.kind==='zoom'?'Zoom stays at the start position and angle; the end capture sets lens and focus.':preset.kind==='focus'?'Rack focus holds the start camera; select each object and set its focus.':preset.kind==='dollyZoom'?'Dolly zoom keeps the start subject and coordinates the lens automatically.':'Position the camera, click a subject, then generate. Start and end captures are optional.'};
}
export function createMovement(project:Project,preset:MovementPreset,seed:Pose,requested:MovementOptions):Take{
 const options={...requested,end:requested.end?structuredClone(requested.end):undefined};
 if(preset.unavailable||preset.kind==='pending')throw Error(preset.unavailable??'This movement needs additional scene capabilities.');
 if(!Number.isFinite(options.duration)||options.duration<.5||options.duration>60||!Number.isFinite(options.amount)||options.amount<.1||options.amount>2)throw Error('Use a duration of 0.5–60 seconds and movement amount of 0.1–2.');
 const hero=mainSubject(project);if(!hero)throw Error('Add a subject before creating a movement.');
 const target=(id:string|undefined)=>{const o=id?project.objects.find(o=>o.id===id):hero;if(!o)throw Error('A selected focus subject is missing. Choose it again.');return o;};
 const first=target(options.startTarget),last=target(preset.kind==='dollyZoom'?options.startTarget:options.endTarget??options.startTarget),a=centre(first),b=centre(last);
 const start=structuredClone(options.start??subjectFraming(first,'Medium',seed,frameSpec(project.frameFormat).ratio));
 const p0=new Vector3(...start.position),q0=!options.start&&options.startTarget?look(p0,a):new Quaternion(...start.quaternion);
 const distance=Math.max(.3,p0.distanceTo(a)),back=p0.clone().sub(a),right=new Vector3(1,0,0).applyQuaternion(q0),forward=new Vector3(0,0,-1).applyQuaternion(q0),up=new Vector3(0,1,0);
 const direction=preset.direction??1,amount=options.amount,travel=Math.min(distance*.35*amount,Math.max(.1,distance-.3)),angle=(preset.kind==='orbit'?Math.PI*2:Math.PI/4)*amount*direction;
 const fixed=movementPolicy(preset).fixed;
 if(options.end&&fixed){
  options.end.position=[...start.position];
  if(preset.kind!=='zoom')options.end.focal=start.focal;
  if(['static','zoom','focus'].includes(preset.kind))options.end.quaternion=[...start.quaternion];
  else {const initial=new Euler().setFromQuaternion(q0,'YXZ'),finish=new Euler().setFromQuaternion(new Quaternion(...options.end.quaternion),'YXZ');if(preset.kind==='pan')initial.y=finish.y;else initial.x=finish.x;options.end.quaternion=new Quaternion().setFromEuler(initial).toArray();}
 }
 const aimOffset=look(p0,a).invert().multiply(q0);
 const paced=(u:number)=>preset.pace?ease(Math.max(0,Math.min(1,(u-.15)/(preset.pace==='crash'?.12:preset.pace==='whip'?.2:.45)))):ease(u);
 function path(u:number){const p=p0.clone();switch(preset.kind){
  case 'dolly':case 'drone':p.addScaledVector(forward,travel*u*direction);break;
  case 'dollyZoom':p.copy(a).addScaledVector(back,1-.35*amount*u*direction);break;
  case 'truck':p.addScaledVector(right,travel*u*direction);break;
  case 'slider':case 'parallaxZoom':p.addScaledVector(right,travel*.4*u*(preset.kind==='slider'?direction:1));break;
  case 'pedestal':case 'crane':p.y+=(direction>0?travel:Math.min(travel,Math.max(.1,p0.y-.12)))*u*direction;break;
  case 'pass':p.addScaledVector(forward,distance*1.35*amount*u);break;
  case 'arc':case 'orbit':p.copy(back).applyAxisAngle(up,angle*u).add(a);break;
  case 'aerial':p.addScaledVector(right,travel*u).y+=Math.sin(Math.PI*u)*distance*.12*amount;break;
  case 'pov':p.addScaledVector(forward,travel*u);p.y+=Math.sin(Math.PI*u*8)*.015*amount;break;
  case 'handheld':p.x+=Math.sin(u*13)*.025*amount*Math.sin(Math.PI*u);p.y+=Math.sin(u*17)*.018*amount*Math.sin(Math.PI*u);break;
 }
 return p;}
 const high=['drone','aerial'].includes(preset.kind);if(!options.start&&high){p0.y+=distance*(preset.kind==='aerial'?.7:.3);back.copy(p0).sub(a);q0.copy(look(p0,a));}
 if(!options.start&&preset.kind==='pov'){p0.y=first.position[1]+(first.kind==='person'?first.size[1]*.9:1.6);q0.copy(look(p0,a));forward.set(0,0,-1).applyQuaternion(q0);}
 const endpoint=path(1),correction=options.end?new Vector3(...options.end.position).sub(endpoint):new Vector3();
 function orientation(p:Vector3,u:number){
  if(options.end&&preset.kind!=='static')return q0.clone().slerp(new Quaternion(...options.end.quaternion),u);
  if(options.endTarget&&['pan','tilt','zoom'].includes(preset.kind))return q0.clone().slerp(look(p,b),u);
  if(preset.kind==='pan')return new Quaternion().setFromAxisAngle(up,-Math.PI/3*amount*direction*u).multiply(q0);
  if(preset.kind==='tilt')return q0.clone().multiply(new Quaternion().setFromEuler(new Euler(Math.PI/5*amount*direction*u,0,0)));
  if(preset.kind==='static'||preset.kind==='focus')return q0.clone();
  if(options.startTarget||options.endTarget||['arc','orbit','crane','drone','aerial','parallaxZoom'].includes(preset.kind))return look(p,a.clone().lerp(b,u)).multiply(aimOffset);
  if(preset.kind==='handheld')return q0.clone().multiply(new Quaternion().setFromEuler(new Euler(Math.sin(u*19)*.006*amount*Math.sin(Math.PI*u),Math.sin(u*11)*.008*amount*Math.sin(Math.PI*u),0)));
  return q0.clone();
 }
 const startDepth=p0.clone().sub(a).dot(new Vector3(0,0,1).applyQuaternion(q0));
 if(preset.kind==='dollyZoom'&&startDepth<=.2)throw Error('Aim the start camera toward the dolly-zoom subject.');
 const count=Math.ceil(options.duration*60),samples:Pose[]=[];
 for(let i=0;i<=count;i++){
  const fraction=i/count,u=paced(fraction),p=path(u).addScaledVector(correction,u),q=orientation(p,u);if(p.y<.05)throw Error('This move passes below the ground. Reduce its amount or choose higher start/end frames.');
  let focal=start.focal;
  if(preset.kind==='dollyZoom'){const z=p.clone().sub(a).dot(new Vector3(0,0,1).applyQuaternion(q));focal=start.focal*z/startDepth;if(focal<12||focal>135)throw Error('Dolly zoom exceeds the 12–135 mm lens range. Reduce movement amount or change the start lens.');}
  else if(preset.kind==='zoom'||preset.kind==='parallaxZoom')focal=Math.max(12,Math.min(135,start.focal*Math.pow(2,amount*direction*u)));
  if(options.end&&preset.kind!=='dollyZoom')focal=start.focal+(options.end.focal-start.focal)*u;
  const focusTarget=a.clone().lerp(b,u),depth=focusTarget.sub(p).dot(new Vector3(0,0,-1).applyQuaternion(q));
  if(preset.kind==='focus'&&depth<=.2)throw Error('The focus target is behind or too close to the fixed camera. Choose a different start frame or target.');
  const focus=options.startTarget||options.endTarget||!options.start||preset.kind==='focus'||preset.kind==='dollyZoom'?Math.max(.2,depth):start.focus+((options.end?.focus??start.focus)-start.focus)*u;
  samples.push({t:options.duration*fraction,position:p.toArray(),quaternion:q.toArray(),focal,focus,aperture:start.aperture+((options.end?.aperture??start.aperture)-start.aperture)*u});
 }
 const take:Take={id:uid(),name:preset.title,mode:preset.kind==='handheld'?'Handheld':high?'Steady drone':preset.kind==='static'||preset.kind==='focus'?'Static':'Gimbal',source:'planned',pathStyle:'linear',ease:false,duration:options.duration,created:new Date().toISOString(),samples,scene:structuredClone(project.objects),room:[...project.room],environment:structuredClone(project.environment),references:structuredClone(project.references)};
 parseProject({...project,takes:[...project.takes,take]});return take;
}
