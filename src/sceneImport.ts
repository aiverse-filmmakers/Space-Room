import {uid} from './model.ts';
import type {SceneObject} from './model.ts';

// Browser-side scene import for external ChatGPT operators. No local server is required.
export function validateImportedScene(raw:unknown){
 const outer=raw as {scene?:unknown}|null;
 const s=((outer&&typeof outer==='object'&&'scene' in outer)?outer.scene:raw) as Record<string,unknown>|null;
 const vec=(a:unknown,n=3):a is number[]=>Array.isArray(a)&&a.length===n&&a.every(v=>typeof v==='number'&&Number.isFinite(v));
 if(!s||typeof s!=='object'||!Array.isArray(s.objects)||s.objects.length>40||!vec(s.room)||s.room.some(n=>n<2||n>100))throw Error('Invalid scene layout. Your original set was preserved.');
 const objects:SceneObject[]=s.objects.map((object:unknown)=>{
  const o=object as Record<string,unknown>;
  if(!o||typeof o.name!=='string'||typeof o.kind!=='string'||!['box','person','sphere','flower','car','cylinder'].includes(o.kind)||!vec(o.position)||!vec(o.size)||o.size.some(n=>n<=0||n>100)||typeof o.rotation!=='number'||!Number.isFinite(o.rotation)||typeof o.color!=='string'||!/^#[0-9a-f]{6}$/i.test(o.color))throw Error('Invalid 3D object. The original set is unchanged.');
  const next={...o,id:typeof o.id==='string'&&o.id?o.id:uid()} as SceneObject;
  if(next.screenBounds&&Array.isArray(next.screenBounds)){
   const b=next.screenBounds;
   const sx=Math.max(b[0],b[2])>1?1000:1,sy=Math.max(b[1],b[3])>1?1000:1;
   next.screenBounds=[b[0]/sx,b[1]/sy,b[2]/sx,b[3]/sy];
  }
  return next;
 });
 if(new Set(objects.map(o=>o.id)).size!==objects.length)throw Error('Duplicate object IDs. The original set is unchanged.');
 const env=(s.environment??{kind:'interior',sky:'#cbd2d1',ground:'#a4aaa4',terrain:'flat'}) as Record<string,unknown>;
 if(!['interior','exterior'].includes(String(env.kind))||!['flat','rolling'].includes(String(env.terrain))||![env.sky,env.ground].every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)))throw Error('Invalid scene environment.');
 const camera=s.camera as Record<string,unknown>|undefined;
 if(camera&&(!vec(camera.position)||!vec(camera.target)||typeof camera.focal!=='number'||camera.focal<12||camera.focal>135))throw Error('Invalid estimated camera.');
 const a=(s.analysis??{}) as Record<string,unknown>;
 const analysis={viewpoint:typeof a.viewpoint==='string'?a.viewpoint:'Operator proposal',scaleAnchor:typeof a.scaleAnchor==='string'?a.scaleAnchor:'Manual review',relationships:Array.isArray(a.relationships)?a.relationships:[],uncertainties:Array.isArray(a.uncertainties)?a.uncertainties:[]};
 if(!analysis.relationships.every((r:unknown)=>{const v=r as Record<string,unknown>;return v&&typeof v.subject==='string'&&typeof v.target==='string'&&typeof v.relation==='string'&&typeof v.evidence==='string';})||!analysis.uncertainties.every((u:unknown)=>typeof u==='string'))throw Error('Invalid spatial analysis.');
 const scene={...s,objects,room:s.room,environment:env,analysis,camera,summary:typeof s.summary==='string'?s.summary:'Imported AI scene',assumptions:Array.isArray(s.assumptions)&&s.assumptions.every(x=>typeof x==='string')?s.assumptions:[]};
 return {scene};
}
