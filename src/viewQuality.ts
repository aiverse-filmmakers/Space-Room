import * as T from 'three';
import {buildSubject} from './setGeometry.ts';
import type {Pose,Project,Vec3} from './model.ts';
export type ViewQuality={status:'clear'|'needs-review';visibleSubjects:number;totalSubjects:number;cutaway:boolean};
/** The same room shell is used by rendering and visibility checks. Only synthetic boundary walls may be cut away. */
export function buildRoomShell(room:Vec3){
 const [w,h,d]=room,g=new T.Group();
 function box(size:Vec3,color:string,position:Vec3,wall?:'north'|'east'|'west'){
  const m=new T.Mesh(new T.BoxGeometry(...size),new T.MeshStandardMaterial({color,roughness:.8}));m.position.fromArray(position);m.castShadow=m.receiveShadow=true;if(wall)m.userData.roomWall=wall;g.add(m);
 }
 box([w,.15,d],'#b6aaa0',[0,-.08,0]);box([w,h,.15],'#e4e1d9',[0,h/2,-d/2],'north');box([.15,h,d],'#d9d9d1',[w/2,h/2,0],'east');
 box([.15,h,d*.34],'#e1ded5',[-w/2,h/2,-d*.33],'west');box([.15,.8,d*.66],'#e1ded5',[-w/2,.4,d*.17],'west');box([.15,.5,d*.66],'#e1ded5',[-w/2,h-.25,d*.17],'west');
 for(let z=-d/2;z<d/2;z+=.6)box([w,.004,.008],'#a99c90',[0,.002,z]);
 return g;
}
export function updateRoomCutaway(root:T.Object3D,room:Vec3,position:T.Vector3){
 const hidden=new Set<string>();root.traverse(o=>{const wall=o.userData.roomWall;if(!wall)return;const hide=wall==='north'?position.z<=-room[2]/2+.1:wall==='east'?position.x>=room[0]/2-.1:position.x<=-room[0]/2+.1;o.visible=!hide;if(hide)hidden.add(wall);});return [...hidden];
}
export function cameraInsideRoom(room:Vec3,pose:Pose){const [x,y,z]=pose.position;return Math.abs(x)<room[0]/2-.2&&Math.abs(z)<room[2]/2-.2&&y>.15&&y<room[1]-.2;}
export function disposeViewWorld(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
/** Geometric validation, not image similarity: checks real mesh targets in frame and unobstructed rays. */
export function inspectView(world:T.Object3D,camera:T.PerspectiveCamera):Omit<ViewQuality,'cutaway'>{
 world.updateMatrixWorld(true);camera.updateMatrixWorld(true);const meshes:T.Mesh[]=[],byId=new Map<string,T.Mesh[]>();
 world.traverseVisible(o=>{if(o instanceof T.Mesh){meshes.push(o);const id=o.userData.objectId;if(id){const list=byId.get(id)??[];list.push(o);byId.set(id,list);}}});
 const ray=new T.Raycaster(),point=new T.Vector3(),ndc=new T.Vector3(),direction=new T.Vector3();let visible=0;
 for(const [id,parts] of byId){let found=false;for(let i=0;i<Math.min(parts.length,8);i++){
  const part=parts[Math.floor(i*parts.length/Math.min(parts.length,8))];if(!part.geometry.boundingBox)part.geometry.computeBoundingBox();part.geometry.boundingBox!.getCenter(point).applyMatrix4(part.matrixWorld);ndc.copy(point).project(camera);
  if(Math.abs(ndc.x)>1||Math.abs(ndc.y)>1||ndc.z<-1||ndc.z>1)continue;
  direction.copy(point).sub(camera.position);ray.set(camera.position,direction.normalize());const hit=ray.intersectObjects(meshes,false)[0];if(hit?.object.userData.objectId===id){found=true;break;}
 }if(found)visible++;}
 return {status:visible>0?'clear':'needs-review',visibleSubjects:visible,totalSubjects:byId.size};
}
export function createViewWorld(project:Project){const world=new T.Group();if(project.environment?.kind!=='exterior')world.add(buildRoomShell(project.room));for(const o of project.objects)world.add(buildSubject(o));return world;}
export function sceneReach(project:Project){return project.objects.reduce((reach,o)=>Math.max(reach,Math.hypot(...o.position)+Math.hypot(...o.size)),Math.hypot(...project.room));}
export function reviewOverview(world:T.Object3D,project:Project,pose:Pose,aspect:number):ViewQuality{
 const camera=new T.PerspectiveCamera(50,aspect,.05,Math.max(300,Math.hypot(...pose.position)+sceneReach(project)+10));camera.filmGauge=36;camera.setFocalLength(pose.focal);camera.position.fromArray(pose.position);camera.quaternion.fromArray(pose.quaternion);
 const hidden=updateRoomCutaway(world,project.room,camera.position);return {...inspectView(world,camera),cutaway:hidden.length>0};
}

export function reviewProjectView(project:Project,pose:Pose,aspect:number){const world=createViewWorld(project);try{return reviewOverview(world,project,pose,aspect);}finally{disposeViewWorld(world);}}
