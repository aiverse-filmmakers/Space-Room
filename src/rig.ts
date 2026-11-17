import {Euler,Quaternion,Vector3} from 'three';
import type {Mode,Pose,Quat,RigSettings,Vec3} from './model.ts';
export class CameraRig {
 lens={focal:35,aperture:2.8,focus:5};
 position=new Vector3(4,1.7,5.5);velocity=new Vector3();yaw=.5;pitch=-.04;aimYaw=.5;aimPitch=-.04;roll=0;clock=0;quaternion=new Quaternion();
 private mode:Mode|null=null;private railYaw=.5;
 reset(){this.position.set(4,1.7,5.5);this.velocity.set(0,0,0);this.yaw=this.aimYaw=.5;this.pitch=this.aimPitch=-.04;this.roll=0;this.mode=null;this.quaternion.setFromEuler(new Euler(this.pitch,this.yaw,0,'YXZ'));}
 look(dx:number,dy:number,s:RigSettings){if(s.mode==='Static')return;this.aimYaw-=dx*.002*s.sensitivity;this.aimPitch=Math.max(-1.5,Math.min(1.5,this.aimPitch-dy*.002*s.sensitivity));}
 stop(){this.velocity.set(0,0,0);this.aimYaw=this.yaw;this.aimPitch=this.pitch;}
 step(dt:number,keys:Set<string>,s:RigSettings){
  dt=Math.min(Math.max(dt,0),.05);this.clock+=dt;
  if(this.mode!==s.mode){this.mode=s.mode;this.railYaw=this.yaw;this.stop();if(s.mode!=='FPV')this.roll=0;}
  if(s.mode==='Static'){this.stop();return;}
  const aerial=s.mode==='Steady drone'?1.6:1;
  const look=1-Math.exp(-dt/Math.max(.015,s.stabilization*aerial));this.yaw+=(this.aimYaw-this.yaw)*look;this.pitch+=(this.aimPitch-this.pitch)*look;
  const target=new Vector3(Number(keys.has('KeyD'))-Number(keys.has('KeyA')),Number(keys.has('KeyE'))-Number(keys.has('KeyQ')),Number(keys.has('KeyS'))-Number(keys.has('KeyW')));
  if(s.mode==='Dolly')target.x=target.y=0;if(s.mode==='Crane')target.x=0;if(target.lengthSq()>1)target.normalize();
  const fixedRail=s.mode==='Dolly'||s.mode==='Crane';target.applyEuler(new Euler(s.mode==='FPV'?this.pitch:0,fixedRail?this.railYaw:this.yaw,0,'YXZ')).multiplyScalar(s.speed*((keys.has('ShiftLeft')||keys.has('ShiftRight'))?.25:1));
  const tau=Math.max(.015,(target.lengthSq()>0?s.acceleration:s.damping)*aerial),decay=Math.exp(-dt/tau);
  // Integrate a constant target analytically, so response is independent of FPS.
  this.position.addScaledVector(target,dt).addScaledVector(this.velocity.clone().sub(target),tau*(1-decay));this.velocity.sub(target).multiplyScalar(decay).add(target);
  if(this.position.y<.12){this.position.y=.12;if(this.velocity.y<0)this.velocity.y=0;}
  const localVelocity=this.velocity.clone().applyEuler(new Euler(0,-this.yaw,0));
  const desiredRoll=s.mode==='FPV'?-Math.max(-1,Math.min(1,localVelocity.x/Math.max(.1,s.speed)))*s.bank*.55:0;this.roll+=(desiredRoll-this.roll)*(1-Math.exp(-dt/.35));
  const shake=s.mode==='Handheld'?(Math.sin(this.clock*8.3)*.009+Math.sin(this.clock*13.7)*.004)*(s.handheld??.35):0;
  this.quaternion.setFromEuler(new Euler(this.pitch+shake,this.yaw+shake*.6,this.roll,'YXZ'));
 }
 pose(t:number,s:RigSettings):Pose{return {t,position:this.position.toArray() as Vec3,quaternion:this.quaternion.toArray() as Quat,focal:s.focal,aperture:s.aperture,focus:s.focus};}
 setPose(p:Pose){this.lens={focal:p.focal,aperture:p.aperture,focus:p.focus};this.position.fromArray(p.position);this.quaternion.fromArray(p.quaternion);const e=new Euler().setFromQuaternion(this.quaternion,'YXZ');this.yaw=this.aimYaw=e.y;this.pitch=this.aimPitch=e.x;this.roll=e.z;this.stop();}
}
