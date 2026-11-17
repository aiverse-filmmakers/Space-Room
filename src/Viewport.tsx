import {hasFacing,facingArrow,turnFacing} from './facing.ts';
import {buildRoomShell,updateRoomCutaway,sceneReach} from './viewQuality.ts';
import {frameSpec} from './formats.ts';
import {defaultLighting} from './continuity.ts';
import {subjectFraming} from './subjectFraming.ts';
import type {FramingPreset} from './subjectFraming.ts';
import {useEffect,useRef,useImperativeHandle,forwardRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {frameSequence,recordPreview,shotPackage} from './renderOutput.ts';
import {buildSubject,rollingGround} from './setGeometry.ts';
import {CameraRig} from './rig.ts';
import {download,sampleTake} from './model.ts';
import type {Project,RigSettings,Take,Pose,Reference,ShotCard,SceneObject} from './model.ts';
export type ViewportHandle={reset:()=>void;pose:()=>Pose;apply:(p:Pose)=>void;still:()=>void;stills:(poses:Pose[],source?:Project)=>Promise<string[]>;shotFrames:(cards:ShotCard[],preview?:boolean)=>Promise<string[]>;sequence:(take:Take)=>Promise<void>;video:(take:Take)=>Promise<void>;package:(take:Take,references:Reference[],direction:string)=>Promise<void>;frame:(id:string,kind:FramingPreset)=>Pose|undefined;focusSubject:(id:string)=>number|undefined};
type Props={canEditFacing:boolean;onFacingChange:(id:string,patch:Partial<SceneObject>)=>void;onFacingDrag:(dragging:boolean)=>void;project:Project;settings:RigSettings;operation:boolean;recording:boolean;playing:boolean;take:Take|null;time:number;selected:string|null;dof:boolean;focusPeaking:boolean;lensLook:'standard'|'anamorphic';onViewChange?:()=>void;onSelect:(id:string|null)=>void;onSample:(p:Pose)=>void;onTime:(t:number)=>void;onStop:()=>void;onOperation:(v:boolean)=>void;onReady:(v:boolean)=>void;onError:(s:string)=>void;onExport:(s:string|null)=>void};
export const Viewport=forwardRef<ViewportHandle,Props>(function Viewport(props,ref){
 const root=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const exporting=useRef(false);
 const state=useRef<{renderer:T.WebGLRenderer;scene:T.Scene;camera:T.PerspectiveCamera;rig:CameraRig;controls:OrbitControls;render:()=>void;rebuild:(source?:Project)=>void;resizeOutput:(w:number,h:number,ratio?:number)=>void;inspectionActive:boolean;resize:()=>void}|null>(null);
 async function output(take:Take,action:(s:NonNullable<typeof state.current>,renderAt:(time:number)=>void)=>Promise<void>){
  const s=state.current;if(!s||exporting.current)throw Error('Wait for the current render to finish.');
  const original=s.rig.pose(0,latest.current.settings),size=s.renderer.getSize(new T.Vector2()),ratio=s.renderer.getPixelRatio();
  exporting.current=true;latest.current.onExport('Preparing shot');
  try{const frame=frameSpec(latest.current.project.frameFormat);s.resizeOutput(frame.width,frame.height,1);s.rebuild({...latest.current.project,objects:take.scene,room:take.room,environment:take.environment});await action(s,t=>{s.rig.setPose(sampleTake(take,t));s.render();});}
  finally{applyPose(original);s.resizeOutput(size.x,size.y,ratio);exporting.current=false;s.rebuild();latest.current.onExport(null);}
 }
 function applyPose(p:Pose){const s=state.current;if(!s)return;s.rig.setPose(p);s.camera.position.fromArray(p.position);s.camera.quaternion.fromArray(p.quaternion);s.controls.target.copy(new T.Vector3(0,0,-Math.max(1,p.focus)).applyQuaternion(s.camera.quaternion).add(s.camera.position));s.controls.enableDamping=false;s.controls.update();s.controls.enableDamping=true;s.camera.position.fromArray(p.position);s.camera.quaternion.fromArray(p.quaternion);s.controls.target.copy(new T.Vector3(0,0,-Math.max(1,p.focus)).applyQuaternion(s.camera.quaternion).add(s.camera.position));s.inspectionActive=false;}
 async function renderShotFrames(cards:ShotCard[],preview=false){const s=state.current;if(!s||exporting.current)throw Error('Wait for the current render.');const original=s.rig.pose(0,latest.current.settings),size=s.renderer.getSize(new T.Vector2()),ratio=s.renderer.getPixelRatio();exporting.current=true;if(!preview)latest.current.onExport('Rendering storyboard cameras');try{const frame=frameSpec(latest.current.project.frameFormat,preview?640:1280);s.resizeOutput(frame.width,frame.height,1);const images:string[]=[];for(const c of cards){s.rebuild({...latest.current.project,objects:c.scene??latest.current.project.objects,room:c.room??latest.current.project.room,environment:c.environment??latest.current.project.environment});s.rig.setPose(c.pose);s.render();images.push(s.renderer.domElement.toDataURL(preview?'image/webp':'image/png',preview ? .8 : undefined));}return images;}finally{applyPose(original);s.resizeOutput(size.x,size.y,ratio);exporting.current=false;s.rebuild();if(!preview)latest.current.onExport(null);}}
 useImperativeHandle(ref,()=>({
  reset(){const s=state.current;if(s){s.rig.reset();s.rig.step(0,new Set(),latest.current.settings);applyPose(s.rig.pose(0,latest.current.settings));}},
  pose(){const s=state.current!;return s.rig.pose(0,{...latest.current.settings,...(latest.current.playing?s.rig.lens:{})});},
  apply:applyPose,
  focusSubject(id){const s=state.current;if(!s)return;const matches:T.Object3D[]=[];s.scene.traverse(o=>{if(o.userData.objectId===id&&o instanceof T.Mesh)matches.push(o);});if(!matches.length)return;const box=new T.Box3();for(const item of matches)box.expandByObject(item);const center=box.getCenter(new T.Vector3());const direction=new T.Vector3();s.camera.getWorldDirection(direction);const distance=center.sub(s.camera.position).dot(direction);return distance>0?Math.max(.0005,Math.min(100,distance)):undefined;},
  shotFrames:renderShotFrames,
  async stills(poses,source){const s=state.current;if(!s||exporting.current)throw Error('Wait for the current render.');const original=s.rig.pose(0,latest.current.settings),size=s.renderer.getSize(new T.Vector2()),ratio=s.renderer.getPixelRatio();exporting.current=true;try{const frame=frameSpec(latest.current.project.frameFormat,640);s.resizeOutput(frame.width,frame.height,1);s.rebuild(source);const images:string[]=[];for(const pose of poses){s.rig.setPose(pose);s.render();images.push(s.renderer.domElement.toDataURL('image/webp',.8));}return images;}finally{applyPose(original);s.resizeOutput(size.x,size.y,ratio);exporting.current=false;s.rebuild();}},
  async still(){try{const s=state.current!;const pose=s.rig.pose(0,{...latest.current.settings,...(latest.current.playing?s.rig.lens:{})}),p=latest.current.project;const [frame]=await renderShotFrames([{id:'still',title:'Current frame',purpose:'Current camera',pose,captured:true,scene:p.objects,room:p.room,environment:p.environment}]);download('scene-room-frame.png',Uint8Array.from(atob(frame.split(',')[1]),c=>c.charCodeAt(0)),'image/png');}catch(e){latest.current.onError(String(e));}},
  async sequence(take){await output(take,async(s,renderAt)=>{const blob=await frameSequence(s.renderer.domElement,take,renderAt,latest.current.onExport,latest.current.project.frameFormat);download('scene-room-frames.zip',blob,'application/zip');});},
  async video(take){await output(take,async(s,renderAt)=>{latest.current.onExport('Recording motion preview');const blob=await recordPreview(s.renderer.domElement,take,renderAt);download('scene-room-motion.webm',blob,blob.type);});},
  async package(take,references,direction){await output(take,async(s,renderAt)=>{const blob=await shotPackage(s.renderer.domElement,take,references,direction,renderAt,latest.current.onExport,latest.current.project.frameFormat);download('scene-room-ai-shot.zip',blob,'application/zip');});},
  frame(id,kind){const s=state.current!,o=latest.current.project.objects.find(o=>o.id===id);if(!o)return;const pose=subjectFraming(o,kind,s.rig.pose(0,latest.current.settings),frameSpec(latest.current.project.frameFormat).ratio);applyPose(pose);return pose;}
 }),[]);
 useEffect(()=>{
  const host=root.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch(e){latest.current.onError(`3D could not start: ${String(e)}`);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.setClearColor('#c8d0d0');renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#cbd2d1');const camera=new T.PerspectiveCamera(50,frameSpec(latest.current.project.frameFormat).ratio,0.05,300);camera.filmGauge=36;
  const rig=new CameraRig();const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1,-1);controls.enabled=false;
  const ambient=new T.HemisphereLight('#e5f2ff','#787160',2.8);scene.add(ambient);const sun=new T.DirectionalLight('#fff1d5',4.2);sun.position.set(-4,7,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;scene.add(sun);
  const subjectGroups=new Map<string,T.Group>();let drag:{object:SceneObject;x:number;y:number;pointer:number;patch:Partial<SceneObject>}|null=null,suppressClick=false;
  let content=new T.Group(),renderRoom=latest.current.project.room,renderReach=sceneReach(latest.current.project);scene.add(content);
  const dispose=(g:T.Group)=>g.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
  function mesh(geometry:T.BufferGeometry,color:string,position:number[],name?:string){const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:0.8,metalness:0}));m.position.set(position[0],position[1],position[2]);m.castShadow=true;m.receiveShadow=true;if(name)m.userData.objectId=name;content.add(m);return m;}
  function rebuild(source=latest.current.project){subjectGroups.clear();renderRoom=source.room;renderReach=sceneReach(source);const lighting=source.environment?.lighting??defaultLighting;sun.position.fromArray(lighting.position);sun.color.set(lighting.color);sun.intensity=lighting.intensity;scene.remove(content);dispose(content);content=new T.Group();scene.add(content);const [w,h,d]=source.room;
   if(source.environment?.kind==='exterior'){scene.background=new T.Color(source.environment.sky);scene.fog=new T.Fog(source.environment.sky,60,250);mesh(source.environment.terrain==='rolling'?rollingGround(Math.max(w,200),Math.max(d,200),source.objects):new T.PlaneGeometry(Math.max(w,200),Math.max(d,200)).rotateX(-Math.PI/2),source.environment.ground,[0,0,0]);}else{scene.background=new T.Color('#cbd2d1');scene.fog=null;
   content.add(buildRoomShell(source.room));}
   for(const o of source.objects){const group=buildSubject(o);subjectGroups.set(o.id,group);content.add(group);if(source.facingGuides!==false&&hasFacing(o))content.add(facingArrow(o,!exporting.current&&latest.current.canEditFacing));if(!exporting.current&&o.id===latest.current.selected){const box=new T.BoxHelper(group,'#207c7b');content.add(box);}}

  }
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bokeh=new BokehPass(scene,camera,{focus:5,aperture:0.0002,maxblur:0.08});
  (bokeh.uniforms as Record<string,{value:number}>).oval={value:1};(bokeh.uniforms as Record<string,{value:number}>).falloff={value:0};(bokeh.uniforms as Record<string,{value:number}>).peaking={value:0};(bokeh.uniforms as Record<string,{value:number}>).peakingAperture={value:0};bokeh.materialBokeh.fragmentShader=bokeh.materialBokeh.fragmentShader.replace('uniform float aspect;','uniform float aspect;\n uniform float oval;\n uniform float falloff;\n uniform float peaking;\n uniform float peakingAperture;').replace('vec2 aspectcorrect = vec2( 1.0, aspect );','float anamorphic = sqrt(oval);\n vec2 aspectcorrect = vec2(1.0 / anamorphic, aspect * anamorphic);').replace('float factor = ( focus + viewZ );','float factor = ( focus + viewZ ) / max(-viewZ, 0.0001);').replace('vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );','float rawBlur = factor * aperture;\n vec2 dofblur = vec2(maxblur * rawBlur / (maxblur + abs(rawBlur)));').replace('gl_FragColor.a = 1.0;',`vec2 field = (vUv - vec2(0.5)) * 2.0;\n gl_FragColor.rgb *= exp(-falloff * dot(field, field));\n if (peaking > 0.5 && getDepth(vUv) < 0.99999) {
    vec2 px = vec2(0.0015, 0.0015 * aspect);
    vec3 center = texture2D(tColor, vUv).rgb;
    float edge = max(length(center - texture2D(tColor, vUv + vec2(px.x, 0.0)).rgb), length(center - texture2D(tColor, vUv + vec2(0.0, px.y)).rgb));
    float sharp = 1.0 - smoothstep(0.001, 0.004, abs(factor * peakingAperture));
    float mark = smoothstep(0.035, 0.13, edge) * sharp;
    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.04, 0.02), mark * 0.95);
   }
   gl_FragColor.a = 1.0;`);composer.addPass(bokeh);composer.addPass(new OutputPass());
  function render(){const l=latest.current;camera.position.copy(rig.position);camera.quaternion.copy(rig.quaternion);updateRoomCutaway(content,renderRoom,camera.position);const lens=(l.playing||exporting.current)?rig.lens:l.settings;camera.far=Math.max(300,camera.position.length()+renderReach+10);camera.near=Math.max(.0001,Math.min(.05,lens.focus/4));camera.setFocalLength(lens.focal);camera.updateProjectionMatrix();if(l.dof||l.focusPeaking&&!exporting.current){const uniforms=bokeh.uniforms as Record<string,{value:number}>;uniforms.focus.value=lens.focus;uniforms.oval.value=l.lensLook==='anamorphic'?2.3:1;uniforms.falloff.value=l.lensLook==='anamorphic'?.16:0;const closeProgress=Math.max(0,Math.min(1,Math.log(Math.max(.0005,lens.focus)/.0005)/Math.log(1/.0005)));uniforms.maxblur.value=.08*(1-.75*closeProgress);const focal=lens.focal;const distance=Math.max(lens.focus*1000,focal+1);uniforms.peakingAperture.value=(focal*focal)/(Math.max(1.2,lens.aperture)*(distance-focal)*36);uniforms.aperture.value=l.dof?uniforms.peakingAperture.value:0;uniforms.peaking.value=l.focusPeaking&&!exporting.current?1:0;composer.render();}else renderer.render(scene,camera);}
  function resizeOutput(w:number,h:number,ratio?:number){if(ratio!==undefined){renderer.setPixelRatio(ratio);composer.setPixelRatio(ratio);}renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  state.current={renderer,scene,camera,rig,controls,render,rebuild,resizeOutput,resize:resizeViewport,inspectionActive:false};controls.addEventListener('start',()=>{if(state.current)state.current.inspectionActive=true;});rebuild();rig.step(0.01,new Set(),latest.current.settings);render();
  function resizeViewport(){if(exporting.current)return;const {width,height}=host.getBoundingClientRect(),aspect=frameSpec(latest.current.project.frameFormat).ratio;const w=Math.min(width,height*aspect),h=w/aspect;resizeOutput(w,h);renderer.domElement.style.width=`${w}px`;renderer.domElement.style.height=`${h}px`;}
  const resize=new ResizeObserver(resizeViewport);resize.observe(host);
  const keys=new Set<string>();const editable=(t:EventTarget|null)=>t instanceof HTMLElement&&(['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||t.isContentEditable);
  const keydown=(e:KeyboardEvent)=>{if(e.code==='Escape'&&drag){finishFacing(false);e.preventDefault();return;}if(editable(e.target))return;if(e.code==='Escape'){keys.clear();rig.stop();latest.current.onOperation(false);return;}if(latest.current.operation&&['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}};
  const keyup=(e:KeyboardEvent)=>keys.delete(e.code);const blur=()=>{keys.clear();rig.stop();};const mouse=(e:MouseEvent)=>{if(document.pointerLockElement===renderer.domElement&&latest.current.operation)rig.look(e.movementX,e.movementY,latest.current.settings);};
  const click=(e:MouseEvent)=>{if(suppressClick){suppressClick=false;return;}if(latest.current.operation){renderer.domElement.requestPointerLock()?.catch(()=>latest.current.onError('Click the viewport again to capture the mouse. Escape releases it.'));return;}const bounds=renderer.domElement.getBoundingClientRect();const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1),camera);const hit=ray.intersectObjects(content.children,true).find(h=>h.object.userData.objectId);latest.current.onSelect(hit?.object.userData.objectId??null);};
  function facingDown(e:PointerEvent){
   const l=latest.current;if(e.button!==0||!l.canEditFacing||l.project.facingGuides===false||exporting.current)return;
   const b=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.params.Line={threshold:.03};ray.setFromCamera(new T.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1),camera);
   const hit=ray.intersectObjects(content.children,true).find(h=>h.object.userData.facingHandle),object=l.project.objects.find(o=>o.id===hit?.object.userData.facingHandle);if(!object)return;
   e.preventDefault();e.stopImmediatePropagation();controls.enabled=false;rig.stop();suppressClick=true;drag={object,x:e.clientX,y:e.clientY,pointer:e.pointerId,patch:{}};renderer.domElement.setPointerCapture(e.pointerId);l.onSelect(object.id);l.onFacingDrag(true);
  }
  function facingMove(e:PointerEvent){if(!drag)return;e.preventDefault();e.stopImmediatePropagation();const o=drag.object;drag.patch=turnFacing(o,(e.clientX-drag.x)*.012,(e.clientY-drag.y)*.012);const edited={...o,...drag.patch},g=subjectGroups.get(o.id);if(g){if(o.kind==='car')g.rotation.y=edited.rotation+(edited.orientation?.[1]??0);else{const head=g.children.find(c=>c.userData.facingHead);if(head){const a=o.kind==='person'?[...(edited.look??[0,0]),0]:edited.orientation??[.2,0,0];head.rotation.set(a[0],a[1],a[2],'YXZ');}}}
   const previous=content.getObjectByName(`facing:${o.id}`);if(previous){content.remove(previous);dispose(previous as T.Group);}content.add(facingArrow(edited,true));for(const child of content.children)if(child instanceof T.BoxHelper)child.update();
  }
  function finishFacing(commit:boolean){if(!drag)return;const active=drag;drag=null;try{renderer.domElement.releasePointerCapture(active.pointer);}catch{}controls.enabled=!latest.current.operation&&!latest.current.playing;latest.current.onFacingDrag(false);if(commit&&Object.keys(active.patch).length){if(latest.current.project.objects.find(o=>o.id===active.object.id)===active.object)latest.current.onFacingChange(active.object.id,active.patch);else latest.current.onError('Subject changed during direction editing. Try again.');}rebuild();}
  const facingUp=(e:PointerEvent)=>{if(drag){e.preventDefault();e.stopImmediatePropagation();finishFacing(true);}},facingCancel=()=>finishFacing(false);
  renderer.domElement.addEventListener('pointerdown',facingDown,true);renderer.domElement.addEventListener('pointermove',facingMove,true);renderer.domElement.addEventListener('pointerup',facingUp,true);renderer.domElement.addEventListener('pointercancel',facingCancel,true);
  const unlocked=()=>{if(document.pointerLockElement!==renderer.domElement&&latest.current.operation){keys.clear();rig.stop();latest.current.onOperation(false);}};document.addEventListener('pointerlockchange',unlocked);
  window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);window.addEventListener('mousemove',mouse);renderer.domElement.addEventListener('click',click);
  let lastView='',lastViewNotice=0;
  let frame=0,last=performance.now(),recordStart=last,wasRecording=false,playStart=last,wasPlaying=false,lastCapture=-1;
  function animate(now:number){frame=requestAnimationFrame(animate);const l=latest.current,dt=(now-last)/1000;last=now;if(exporting.current)return;
   if(l.recording&&!wasRecording){recordStart=now;lastCapture=-1;}wasRecording=l.recording;
   if(l.playing&&!wasPlaying)playStart=now-l.time*1000;wasPlaying=l.playing;
   if(l.playing&&l.take){const t=Math.min(l.take.duration,(now-playStart)/1000);rig.setPose(sampleTake(l.take,t));l.onTime(t);if(t>=l.take.duration)l.onStop();}
   else if(l.operation){rig.step(dt,keys,l.settings);}
   else {keys.clear();rig.stop();if(controls.enabled&&state.current?.inspectionActive){controls.update();rig.setPose({...rig.pose(0,l.settings),position:camera.position.toArray(),quaternion:camera.quaternion.toArray()});}}
   if(l.recording&&now-lastCapture>=1000/30){l.onSample(rig.pose((now-recordStart)/1000,l.settings));lastCapture=now;}
   render();
   if(now-lastViewNotice>150){const next=JSON.stringify(rig.pose(0,l.settings));if(next!==lastView){lastView=next;l.onViewChange?.();}lastViewNotice=now;}
  }
  frame=requestAnimationFrame(animate);latest.current.onReady(true);
  return()=>{cancelAnimationFrame(frame);renderer.domElement.removeEventListener('pointerdown',facingDown,true);renderer.domElement.removeEventListener('pointermove',facingMove,true);renderer.domElement.removeEventListener('pointerup',facingUp,true);renderer.domElement.removeEventListener('pointercancel',facingCancel,true);resize.disconnect();document.removeEventListener('pointerlockchange',unlocked);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);window.removeEventListener('mousemove',mouse);renderer.domElement.removeEventListener('click',click);if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();controls.dispose();dispose(content);composer.dispose();renderer.dispose();renderer.domElement.remove();state.current=null;};
 },[]);
 useEffect(()=>{state.current?.rebuild();},[props.project.objects,props.project.room,props.project.environment,props.project.facingGuides,props.selected,props.canEditFacing]);
 useEffect(()=>{const s=state.current;if(!s)return;s.controls.enabled=!props.operation&&!props.playing;if(!props.operation&&!props.playing)applyPose(s.rig.pose(0,latest.current.settings));if(!props.operation&&document.pointerLockElement===s.renderer.domElement)document.exitPointerLock();},[props.operation,props.playing]);
 useEffect(()=>{state.current?.resize();},[props.project.frameFormat]);
 return <div className="viewport-canvas" ref={root}/>;
});
