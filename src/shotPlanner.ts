import {cameraInsideRoom,createViewWorld,disposeViewWorld,reviewOverview} from './viewQuality.ts';
import {frameSpec} from './formats.ts';
import * as T from 'three';
import {fitReferenceSet} from './framing.ts';
import type {Project,Pose,SceneObject,ShotCard} from './model.ts';
function camera(position:T.Vector3,target:T.Vector3,focal:number):Pose{const cam=new T.PerspectiveCamera();cam.position.copy(position);cam.lookAt(target);return {t:0,position:position.toArray(),quaternion:cam.quaternion.toArray(),focal,aperture:2.8,focus:Math.max(.2,position.distanceTo(target))};}
function centre(o:SceneObject){return new T.Vector3(...o.position).add(new T.Vector3(0,['car','flower','person'].includes(o.kind)?o.size[1]*.5:0,0));}
export function compassShots(project:Project):ShotCard[]{
 const bounds=new T.Box3();for(const o of project.objects){const foot=['car','flower','person'].includes(o.kind);bounds.expandByPoint(new T.Vector3(o.position[0]-o.size[0]/2,o.position[1]-(foot?0:o.size[1]/2),o.position[2]-o.size[2]/2));bounds.expandByPoint(new T.Vector3(o.position[0]+o.size[0]/2,o.position[1]+(foot?o.size[1]:o.size[1]/2),o.position[2]+o.size[2]/2));}if(bounds.isEmpty())bounds.set(new T.Vector3(-2,0,-2),new T.Vector3(2,3,2));const c=bounds.getCenter(new T.Vector3()),r=Math.max(5,bounds.getSize(new T.Vector3()).length());
 const world=createViewWorld(project),aspect=frameSpec(project.frameFormat).ratio;
 try{return [['North',0,1],['South',0,-1],['East',-1,0],['West',1,0]].map(([name,x,z])=>{
  const pos=c.clone().add(new T.Vector3(Number(x)*r,.5,Number(z)*r)),estimate={position:pos.toArray(),target:c.toArray(),focal:35};
  let pose=fitReferenceSet(project.objects,estimate,2.8,aspect);
  if(project.environment?.kind!=='exterior')for(const focal of [35,28,24,20,16,12]){const candidate=fitReferenceSet(project.objects,{...estimate,focal},2.8,aspect);if(cameraInsideRoom(project.room,candidate)){pose=candidate;break;}}
  const viewQuality=reviewOverview(world,project,pose,aspect);
  return {id:String(name),title:`Facing ${name}`,purpose:'Visibility-checked reconstructed overview; hidden details are inferred.'+(viewQuality.cutaway?' Obstructing room boundary shown as a cutaway.':''),pose,captured:false,viewQuality};
 });}finally{disposeViewWorld(world);}

}
export function cinematicShots(project:Project):ShotCard[]{
 const objects=project.objects;const hero=objects.find(o=>o.kind==='car')??objects.find(o=>o.kind==='person')??objects[0];if(!hero)return [];
 const other=objects.find(o=>o.kind==='flower')??objects.find(o=>o.id!==hero.id)??hero;
 const h=centre(hero),s=centre(other);if(other.kind==='flower')s.y=other.position[1]+other.size[1]-other.size[0]*.46;
 const span=Math.max(hero.size[0],hero.size[2],2),car=hero.kind==='car';
 const views:[string,string,Pose,string][]=[
  ['Establish the world','Introduce the spatial relationship between the hero and its surroundings.',project.homeCamera??compassShots(project)[0].pose,hero.id],
  [car?'Rear three-quarter':'Three-quarter portrait','A lower, oblique viewpoint gives the hero depth and separates it from the background.',camera(h.clone().add(new T.Vector3(-span,.15,span*.9)),h,50),hero.id],
  [other.kind==='flower'?'Petal study':'Subject detail','Use a longer lens to isolate shape and compress the background.',camera(s.clone().add(new T.Vector3(other.size[0]*.25,.1,Math.max(2,other.size[0]*2.3))),s,85),other.id],
  [car?'Wheel-level wonder':'Ground-level scale','An ultra-wide low angle emphasizes the scale difference. This is a 12 mm perspective lens, not a fisheye projection.',camera(new T.Vector3(hero.position[0]+hero.size[0]*.3,hero.position[1]+.18,hero.position[2]+hero.size[2]*.65),s,12),hero.id],
  ['Reverse perspective','Reveal the opposite side and use the hero as foreground context.',camera(h.clone().add(new T.Vector3(span*.4,.7,-span*1.3)),s.clone().lerp(h,.4),35),hero.id],
  [car?'From the cabin':'Over the foreground',car?'Explore an interior viewpoint. Cabin details are only a stand-in and may need authored assets.':'Place a nearby subject in foreground and reveal the hero beyond.',camera(car?new T.Vector3(hero.position[0],hero.position[1]+hero.size[1]*.7,hero.position[2]+hero.size[2]*.1):s.clone().add(new T.Vector3(.5,.2,.5)),car?new T.Vector3(hero.position[0]+span*2,hero.position[1]+hero.size[1]*.7,hero.position[2]):h,28),hero.id]
 ];return views.map(([title,purpose,pose,subjectId],i)=>({id:`shot-${i+1}`,title,purpose,pose,subjectId,captured:false}));
}

export function sceneSignature(project:Project){const text=JSON.stringify(['facing-guides-v3',project.facingGuides!==false,project.objects,project.room,project.environment,project.frameFormat??'16:9']);let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0).toString(16);}
