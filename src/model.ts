import type {ViewQuality} from './viewQuality.ts';
import {frameFormats,sensorSize,frameSpec} from './formats.ts';
import type {FrameFormat} from './formats.ts';
import {validateProduction} from './production.ts';
import type {Production} from './production.ts';
import {Quaternion, Vector3,CatmullRomCurve3} from 'three';
export type Vec3=[number,number,number];
export type Quat=[number,number,number,number];
export type Mode='Gimbal'|'FPV'|'Handheld'|'Dolly'|'Crane'|'Steady drone'|'Static';
export type SceneObject={assetId?:string;look?:[number,number];id:string;name:string;kind:'box'|'person'|'sphere'|'flower'|'car'|'cylinder'|'model';position:Vec3;size:Vec3;color:string;rotation:number;screenBounds?:[number,number,number,number];depthRank?:number;orientation?:Vec3;description?:string;occludedBy?:string[]};
export type MeshAsset={id:string;name:string;data:string};
export type Lens={focal:number;aperture:number;focus:number};
export type Pose=Lens&{t:number;position:Vec3;quaternion:Quat};
export type Take={id:string;name:string;mode:Mode;samples:Pose[];duration:number;created:string;scene:SceneObject[];room:[number,number,number];source:'recorded'|'planned';thumbnail?:string;pathStyle?:'linear'|'smooth';ease?:boolean;environment?:Environment;references?:Reference[]};
export type Reference={id:string;name:string;data:string};
export type Lighting={position:Vec3;color:string;intensity:number};
export type Environment={lighting?:Lighting;kind:'interior'|'exterior';sky:string;ground:string;terrain:'flat'|'rolling'};
export type ShotPanel={id:string;role:'start'|'middle'|'end';pose:Pose;time?:number;takeId?:string;takeName?:string;duration?:number;thumbnail?:string;scene:SceneObject[];room:Vec3;environment?:Environment;referenceIds:string[]};
export type ShotCard={viewQuality?:ViewQuality;continuity?:{comparisonId?:string;axis?:[string,string]};contextRevision?:string;pinned?:boolean;panels?:ShotPanel[];continuityNote?:string;id:string;title:string;purpose:string;pose:Pose;thumbnail?:string;subjectId?:string;captured:boolean;scene?:SceneObject[];room?:Vec3;environment?:Environment;referenceIds?:string[]};
export type FrameImageState={frameId:string;model?:string;prompt?:string;basePrompt?:string;referenceIds?:string[];view?:'mockup'|'generated';selected?:string};
export type GenerationLink={frameId?:string;framingKey?:string;model?:string;id:string;kind:'image'|'video';name:string;created:string;takeId?:string;status?:string;error?:string};
export type Project={assets?:MeshAsset[];facingGuides?:boolean;frameImages?:FrameImageState[];frameFormat?:FrameFormat;coverageFormat?:FrameFormat;production?:Production;generations?:GenerationLink[];version:1;name:string;objects:SceneObject[];room:[number,number,number];takes:Take[];references:Reference[];environment?:Environment;homeCamera?:Pose;coverageSignature?:string;storyboard?:ShotCard[];compass?:ShotCard[];analysis?:{viewpoint:string;scaleAnchor:string;relationships:{subject:string;relation:string;target:string;evidence:string;maxDistance?:number}[];uncertainties:string[]}};
export type RigSettings=Lens&{mode:Mode;speed:number;acceleration:number;damping:number;stabilization:number;sensitivity:number;handheld:number;bank:number};
export const defaults:RigSettings={mode:'Gimbal',speed:1.8,acceleration:0.8,damping:0.45,stabilization:0.35,sensitivity:0.65,handheld:0.35,bank:0.35,focal:35,aperture:2.8,focus:5};
export const uid=()=>crypto.randomUUID();
export function newProject():Project{return {version:1,assets:[],name:'Untitled scene',room:[10,3.6,12],references:[],takes:[],objects:[{id:uid(),name:'Dining table',kind:'box',position:[0,0.85,-1],size:[2.3,0.12,1.2],color:'#a67e52',rotation:0},{id:uid(),name:'Subject',kind:'person',position:[1.6,0,-2],size:[0.5,1.8,0.5],color:'#b8755d',rotation:0},{id:uid(),name:'Low plinth',kind:'box',position:[-2.8,0.35,-2.5],size:[1.4,0.7,1.4],color:'#798b87',rotation:0}]};}
const pathCache=new WeakMap<Take,CatmullRomCurve3>();
export function sampleTake(take:Take,t:number):Pose {
 const ss=take.samples;if(!ss.length)throw Error('Take has no samples');
 const outputTime=Math.max(0,Math.min(take.duration,t)),fraction=outputTime/take.duration;const time=take.source==='planned'&&take.ease?(fraction*fraction*(3-2*fraction))*take.duration:outputTime;let lo=0,hi=ss.length-1;
 while(lo<hi){const m=Math.floor((lo+hi)/2);if(ss[m].t<time)lo=m+1;else hi=m;}
 const b=ss[lo],a=ss[Math.max(0,lo-1)];const u=b.t===a.t?0:(time-a.t)/(b.t-a.t);
 let position=new Vector3().fromArray(a.position).lerp(new Vector3().fromArray(b.position),u);
 if(take.source==='planned'&&take.pathStyle==='smooth'&&ss.length>2){let curve=pathCache.get(take);if(!curve){curve=new CatmullRomCurve3(ss.map(p=>new Vector3(...p.position)),false,'centripetal');pathCache.set(take,curve);}position=curve.getPoint((Math.max(0,lo-1)+u)/(ss.length-1));}
 return {t:outputTime,position:position.toArray() as Vec3,quaternion:new Quaternion().fromArray(a.quaternion).slerp(new Quaternion().fromArray(b.quaternion),u).toArray() as Quat,focal:a.focal+(b.focal-a.focal)*u,aperture:a.aperture+(b.aperture-a.aperture)*u,focus:a.focus+(b.focus-a.focus)*u};
}
export function refineTake(take:Take,strength:number,duration:number):Take {
 if(!Number.isFinite(duration)||duration<=0)throw Error('Duration must be positive');
 const radius=Math.round(Math.max(0,Math.min(1,strength))*12);
 const samples=take.samples.map((s,i,all)=>{
  if(i===0||i===all.length-1||!radius)return {...s,t:s.t/take.duration*duration};
  const pos=new Vector3(),q=new Quaternion();let total=0;
  for(let j=Math.max(0,i-radius);j<=Math.min(all.length-1,i+radius);j++){
   const weight=radius+1-Math.abs(j-i);pos.addScaledVector(new Vector3().fromArray(all[j].position),weight);
   if(total===0)q.fromArray(all[j].quaternion);else q.slerp(new Quaternion().fromArray(all[j].quaternion),weight/(total+weight));total+=weight;
  }
  return {...s,t:s.t/take.duration*duration,position:pos.divideScalar(total).toArray() as Vec3,quaternion:q.toArray() as Quat};
 });
 return {...take,samples,duration};
}
export function trimTake(take:Take,start:number,end:number):Take{
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>take.duration||end-start<.1)throw Error('Choose a trim range of at least 0.1 seconds within the take.');
 const times=take.source==='planned'?Array.from({length:Math.ceil((end-start)*30)+1},(_,i)=>Math.min(end,start+i/30)):[start,...take.samples.filter(s=>s.t>start&&s.t<end).map(s=>s.t),end];
 const unique=[...new Set(times)];if(unique.at(-1)!==end)unique.push(end);
 return {...take,id:uid(),name:take.name+' trimmed',source:'recorded',pathStyle:undefined,ease:undefined,duration:end-start,samples:unique.map(t=>({...sampleTake(take,t),t:t-start}))};
}
export function parseProject(value:unknown):Project {
 const p=value as Project;
 const finite=(a:unknown,n:number)=>Array.isArray(a)&&a.length===n&&a.every(x=>typeof x==='number'&&Number.isFinite(x));
 const validRoom=(r:Vec3)=>finite(r,3)&&r.every(x=>x>=1&&x<=1000);
 const validateEnvironment=(e:Environment|undefined)=>{if(e?.lighting&&(!finite(e.lighting.position,3)||Math.hypot(...e.lighting.position)<.01||!/^#[0-9a-f]{6}$/i.test(e.lighting.color)||!Number.isFinite(e.lighting.intensity)||e.lighting.intensity<0||e.lighting.intensity>20))throw Error('Invalid set lighting');if(e&&(!['interior','exterior'].includes(e.kind)||!['flat','rolling'].includes(e.terrain)||![e.sky,e.ground].every(c=>/^#[0-9a-f]{6}$/i.test(c))))throw Error('Invalid set environment');};
 const validatePose=(s:Pose)=>{if(!s||!Number.isFinite(s.t)||!finite(s.position,3)||!finite(s.quaternion,4)||Math.abs(Math.hypot(...s.quaternion)-1)>.01||![s.focal,s.aperture,s.focus].every(x=>Number.isFinite(x)&&x>0&&x<=10000))throw Error('Invalid camera pose');};
 const validateRefs=(refs:Reference[])=>{if(!Array.isArray(refs)||refs.length>50)throw Error('Too many reference images');for(const r of refs){if(!r||typeof r.id!=='string'||typeof r.name!=='string'||typeof r.data!=='string'||r.data.length>18e6||!/^data:image\/(png|jpeg|webp);base64,/.test(r.data))throw Error('Invalid reference image');}if(new Set(refs.map(r=>r.id)).size!==refs.length)throw Error('Duplicate reference identifiers');};
 if(!p||p.version!==1||typeof p.name!=='string'||!validRoom(p.room)||!Array.isArray(p.objects)||!Array.isArray(p.takes))throw Error('This is not a supported Scene Room project.');
 if(p.objects.length>1000||p.takes.length>1000)throw Error('Project exceeds supported limits');
 if(p.assets&&(!Array.isArray(p.assets)||p.assets.length>20||new Set(p.assets.map(a=>a.id)).size!==p.assets.length||p.assets.some(a=>!a||typeof a.id!=='string'||typeof a.name!=='string'||typeof a.data!=='string'||a.data.length>30e6||!a.data.startsWith('data:model/gltf-binary;base64,')&&!a.data.startsWith('data:model/gltf+json;base64,'))))throw Error('Invalid 3D asset library');
 const validateObject=(o:SceneObject)=>{if(!o||typeof o.id!=='string'||typeof o.name!=='string'||!['box','person','sphere','flower','car','cylinder','model'].includes(o.kind)||!finite(o.position,3)||!finite(o.size,3)||o.size.some(x=>x<=0||x>1000)||!Number.isFinite(o.rotation)||!/^#[0-9a-f]{6}$/i.test(o.color))throw Error('Invalid scene object');if(o.kind==='model'&&(!o.assetId||!p.assets?.some(a=>a.id===o.assetId)))throw Error('3D model asset is missing from the project.');if(o.look&&(!finite(o.look,2)||o.look.some(v=>Math.abs(v)>Math.PI+0.01)))throw Error('Invalid head direction');if(o.orientation&&!finite(o.orientation,3))throw Error('Invalid subject orientation');if(o.screenBounds&&(!finite(o.screenBounds,4)||o.screenBounds.some(x=>x<0||x>1)||o.screenBounds[2]<=o.screenBounds[0]||o.screenBounds[3]<=o.screenBounds[1]))throw Error('Invalid reference framing');};
 for(const cards of [p.storyboard,p.compass])if(cards){if(!Array.isArray(cards)||cards.length>24)throw Error('Invalid shot board');for(const card of cards){if(typeof card.id!=='string'||typeof card.title!=='string'||typeof card.purpose!=='string'||typeof card.captured!=='boolean')throw Error('Invalid shot card');validatePose(card.pose);if(card.continuity&&((card.continuity.comparisonId!==undefined&&typeof card.continuity.comparisonId!=='string')||(card.continuity.axis!==undefined&&(!Array.isArray(card.continuity.axis)||card.continuity.axis.length!==2||!card.continuity.axis.every(id=>typeof id==='string')))))throw Error('Invalid continuity settings');if(card.viewQuality&&(!['clear','needs-review'].includes(card.viewQuality.status)||typeof card.viewQuality.cutaway!=='boolean'||![card.viewQuality.visibleSubjects,card.viewQuality.totalSubjects].every(n=>Number.isInteger(n)&&n>=0)||card.viewQuality.visibleSubjects>card.viewQuality.totalSubjects))throw Error('Invalid view quality report');if(card.contextRevision!==undefined&&typeof card.contextRevision!=='string')throw Error('Invalid shot context revision');if(card.pinned!==undefined&&typeof card.pinned!=='boolean')throw Error('Invalid shot pin');if(card.continuityNote!==undefined&&(typeof card.continuityNote!=='string'||card.continuityNote.length>2000))throw Error('Invalid continuity note');if(card.panels){if(!Array.isArray(card.panels)||card.panels.length>3||new Set(card.panels.map(p=>p.role)).size!==card.panels.length)throw Error('Invalid shot panels');for(const panel of card.panels){if(!panel||typeof panel.id!=='string'||!['start','middle','end'].includes(panel.role)||!Array.isArray(panel.scene)||!validRoom(panel.room)||!Array.isArray(panel.referenceIds)||!panel.referenceIds.every(id=>typeof id==='string')||panel.time!==undefined&&(!Number.isFinite(panel.time)||panel.time<0)||panel.duration!==undefined&&(!Number.isFinite(panel.duration)||panel.duration<=0)||panel.takeId!==undefined&&typeof panel.takeId!=='string'||panel.takeName!==undefined&&typeof panel.takeName!=='string'||panel.thumbnail&&!/^data:image\/(png|jpeg|webp);base64,/.test(panel.thumbnail))throw Error('Invalid shot panel');validatePose(panel.pose);panel.scene.forEach(validateObject);validateEnvironment(panel.environment);}}if(card.scene){if(!Array.isArray(card.scene))throw Error('Invalid shot scene');card.scene.forEach(validateObject);}if(card.room&&!validRoom(card.room))throw Error('Invalid shot bounds');validateEnvironment(card.environment);if(card.referenceIds&&(!Array.isArray(card.referenceIds)||!card.referenceIds.every(id=>typeof id==='string')))throw Error('Invalid shot reference binding');if(card.thumbnail&&!/^data:image\/(png|jpeg|webp);base64,/.test(card.thumbnail))throw Error('Invalid shot preview');}}
 if(p.frameImages&&(!Array.isArray(p.frameImages)||p.frameImages.length>100||new Set(p.frameImages.map(f=>f.frameId)).size!==p.frameImages.length||p.frameImages.some(f=>!f||typeof f.frameId!=='string'||f.frameId.length>100||f.model!==undefined&&(typeof f.model!=='string'||f.model.length>200)||f.prompt!==undefined&&(typeof f.prompt!=='string'||f.prompt.length>4000)||f.basePrompt!==undefined&&(typeof f.basePrompt!=='string'||f.basePrompt.length>6000)||f.referenceIds!==undefined&&(!Array.isArray(f.referenceIds)||f.referenceIds.length>8||!f.referenceIds.every(id=>typeof id==='string'&&id.length<=100))||f.view!==undefined&&!['mockup','generated'].includes(f.view)||f.selected!==undefined&&(typeof f.selected!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(f.selected)))))throw Error('Invalid frame image settings');
 if(p.generations?.some(g=>g.frameId!==undefined&&(typeof g.frameId!=='string'||g.frameId.length>100)||g.framingKey!==undefined&&(typeof g.framingKey!=='string'||g.framingKey.length>100)||g.model!==undefined&&(typeof g.model!=='string'||g.model.length>200)))throw Error('Invalid frame image record');
 if(p.generations&&(!Array.isArray(p.generations)||p.generations.length>500||p.generations.some(g=>!g||typeof g.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(g.id)||!['image','video'].includes(g.kind)||typeof g.name!=='string'||g.name.length>120||typeof g.created!=='string'||g.takeId!==undefined&&typeof g.takeId!=='string'||g.status!==undefined&&typeof g.status!=='string'||g.error!==undefined&&typeof g.error!=='string')))throw Error('Invalid generation records');
 if(p.facingGuides!==undefined&&typeof p.facingGuides!=='boolean')throw Error('Invalid facing guide setting');
 if(p.frameFormat!==undefined&&!Object.hasOwn(frameFormats,p.frameFormat)||p.coverageFormat!==undefined&&!Object.hasOwn(frameFormats,p.coverageFormat))throw Error('Unsupported frame format');
 if(p.production)validateProduction(p.production,validatePose,validateObject,validateEnvironment);
 validateEnvironment(p.environment);if(p.homeCamera)validatePose(p.homeCamera);p.objects.forEach(validateObject);validateRefs(p.references);
 if(new Set(p.objects.map(o=>o.id)).size!==p.objects.length||new Set(p.takes.map(t=>t.id)).size!==p.takes.length)throw Error('Duplicate identifiers');
 p.takes.forEach(t=>{if(!t||typeof t.id!=='string'||typeof t.name!=='string'||!['recorded','planned'].includes(t.source)||!['Gimbal','FPV','Handheld','Dolly','Crane','Steady drone','Static'].includes(t.mode)||!Number.isFinite(t.duration)||t.duration<=0||t.duration>3600||!Array.isArray(t.samples)||t.samples.length<2||t.samples.length>100000||!Array.isArray(t.scene)||!validRoom(t.room))throw Error('Invalid take');if(t.pathStyle&&!['linear','smooth'].includes(t.pathStyle))throw Error('Invalid path style');if(t.ease!==undefined&&typeof t.ease!=='boolean')throw Error('Invalid path easing');t.scene.forEach(validateObject);validateEnvironment(t.environment);if(t.references)validateRefs(t.references);if(t.thumbnail&&(typeof t.thumbnail!=='string'||t.thumbnail.length>1e6||!/^data:image\/(png|jpeg|webp);base64,/.test(t.thumbnail)))throw Error('Invalid take thumbnail');let prev=-1;t.samples.forEach(s=>{validatePose(s);if(s.t<0||s.t<=prev||s.t>t.duration+.001)throw Error('Invalid camera sample times');prev=s.t;});if(Math.abs(t.samples[0].t)>.001||Math.abs(t.samples.at(-1)!.t-t.duration)>.001)throw Error('Take must include start and end samples');});
 return structuredClone(p);
}

export function download(name:string,data:BlobPart,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function trajectory(take:Take,format:FrameFormat='16:9'){
 const count=Math.ceil(take.duration*30),samples=take.source==='planned'?Array.from({length:count+1},(_,i)=>sampleTake(take,Math.min(take.duration,i/30))):take.samples;
 return {schema:'scene-room.camera.v1',units:'metres',coordinates:'right-handed, Y-up, camera looks down local -Z',sensor:sensorSize(frameSpec(format).ratio),frame:frameSpec(format),duration:take.duration,mode:take.mode,source:take.source,sampling:take.source==='planned'?'evaluated at 30 fps plus exact end':'original timestamped poses',keyframes:take.source==='planned'?take.samples:undefined,pathStyle:take.pathStyle,ease:take.ease,samples};
}
