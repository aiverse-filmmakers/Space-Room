// Jev is a replaceable judgment layer, never the renderer or free-form director.
export function decisionRequest({analysis,candidates,task='Rank cinematic shot proposals'}){
 if(!analysis||!Array.isArray(candidates)||!candidates.length||candidates.length>24)throw Error('Provide a spatial reading and 1–24 shot proposals.');
 const state={task,analysis,candidates:candidates.map(c=>({id:c.id,title:c.title,purpose:c.purpose,pose:c.pose,subjectId:c.subjectId}))};
 if(JSON.stringify(state).length>28000)throw Error('Decision context is too large; use a bounded scene summary.');
 const questions={scene_consistency:{type:'noul',instructions:'Does the supplied spatial reading preserve its stated relative depth, adjacency, orientation and scale without internal contradictions?',criteria:{false:'The reading contradicts one or more explicit scene relationships.',true:'The reading consistently preserves the explicitly described relationships.'}}};
 candidates.forEach((c,i)=>{if(typeof c.id!=='string'||typeof c.title!=='string'||typeof c.purpose!=='string')throw Error('Invalid shot proposal');questions[`shot_${i}`]={type:'score',instructions:`Evaluate candidate ${i} (${c.id}) for a useful, distinctive cinematic composition in this scene. Consider subject visibility, meaningful lens choice and scale. Judge the proposal, not final visual realism.`,criteria:['Unusable or contradicts the scene','Weak or redundant','Usable supporting shot','Strong and distinctive','Excellent addition to this storyboard']};});
 return {model:'typesafe/jev-1.14',state,questions};
}
export async function judgeShots(input,{enabled=false,key,fetchImpl=fetch}={}){
 if(!enabled)throw Error('Paid decision calls are disabled. Local shot suggestions remain available.');
 if(!key)throw Error('No decision-provider credential is available.');
 const request=decisionRequest(input),response=await fetchImpl('https://openrouter.ai/api/alpha/decisions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error(`Decision service failed (${response.status}). Keep the current storyboard.`);
 const data=await response.json(),consistency=data.answers?.scene_consistency?.noul;
 if(!Number.isFinite(consistency)||consistency<0||consistency>1)throw Error('Invalid decision response. Keep the current storyboard.');
 const ranked=input.candidates.map((c,i)=>{const a=data.answers?.[`shot_${i}`];if(a?.type!=='score'||!Number.isFinite(a.score)||a.score<0||a.score>4||!Number.isFinite(a.confidence)||a.confidence<0||a.confidence>1)throw Error('Incomplete shot ranking. Keep the current storyboard.');return {id:c.id,score:a.score,confidence:a.confidence};}).sort((a,b)=>b.score-a.score);
 return {model:data.model||request.model,ranked,consistency,needsReview:consistency<.85||ranked.some(r=>r.confidence<.8),usage:data.usage??null};
}
