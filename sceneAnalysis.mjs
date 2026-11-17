const finite3=a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite);
export function validateAnalysis(scene){
 const a=scene.analysis;if(!a||typeof a.viewpoint!=='string'||typeof a.scaleAnchor!=='string'||!Array.isArray(a.relationships)||!Array.isArray(a.uncertainties))throw Error('Image analysis is missing viewpoint, scale or spatial relationships. The existing set was preserved.');
 const byId=new Map(scene.objects.map(o=>[o.id,o]));
 if(byId.size!==scene.objects.length||scene.objects.some(o=>typeof o.id!=='string'||!o.id||typeof o.description!=='string'||!o.description.trim()||!finite3(o.orientation)||!Array.isArray(o.occludedBy)||o.occludedBy.some(id=>!byId.has(id))))throw Error('Image analysis is missing subject identity, orientation or occlusion evidence.');
 const camera=scene.camera,forward=camera.target.map((n,i)=>n-camera.position[i]);forward[1]=0;const length=Math.hypot(...forward)||1;const f=forward.map(n=>n/length),right=[-f[2],0,f[0]];
 for(const r of a.relationships){const subject=byId.get(r.subject),target=byId.get(r.target);if(!subject||!target||subject===target||!['near','behind','in_front_of','left_of','right_of','faces_toward'].includes(r.relation)||typeof r.evidence!=='string'||!r.evidence.trim())throw Error('Invalid image relationship');
  const delta=subject.position.map((n,i)=>n-target.position[i]);const depth=delta.reduce((v,n,i)=>v+n*f[i],0),side=delta.reduce((v,n,i)=>v+n*right[i],0);
  if(r.relation==='near'){const cap=Math.max(target.size[0],target.size[2])*2;if(!Number.isFinite(r.maxDistance)||r.maxDistance<=0||r.maxDistance>Math.max(3,cap)||Math.hypot(delta[0],delta[2])>r.maxDistance+.1)throw Error(`Spatial analysis contradicts “${subject.name} near ${target.name}”. Re-read the reference instead of fitting a distant object.`);}
  if((r.relation==='behind'&&depth<-.1)||(r.relation==='in_front_of'&&depth>.1)||(r.relation==='left_of'&&side>.1)||(r.relation==='right_of'&&side<-.1))throw Error(`Spatial analysis contradicts ${r.relation} for ${subject.name}.`);
 }
 return scene;
}
