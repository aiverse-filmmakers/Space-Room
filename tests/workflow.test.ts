import {test} from 'node:test';import assert from 'node:assert/strict';
import {planWorkflow,workflowDecisionRequest} from '../workflow.mjs';
const state={objects:4,references:1,takes:5,shots:6};
const input=(task:string)=>({task,instruction:'Prepare this filmmaking task',state});
test('explicit workflows skip paid judgment and route local tools or the appropriate host',async()=>{
 let calls=0;const opts={enabled:true,key:'test',fetchImpl:async()=>{calls++;throw Error('should not be called');}};
 for(const [task,route] of [['scene','scene_analysis'],['edit','scene_actions'],['shots','creative_direction'],['motion','camera_planning'],['code','coding']]){const p=await planWorkflow(input(task),opts);assert.equal(p.route,route);assert.equal(p.status,'host');}
 assert.equal((await planWorkflow(input('export'),opts)).status,'local');assert.equal((await planWorkflow(input('generate'),opts)).next,'prepare-generation');assert.equal(calls,0);
});
test('no-spend auto routing asks for a task category without accessing the provider',async()=>{let called=false;const p=await planWorkflow(input('auto'),{key:'test',fetchImpl:async()=>{called=true;}});assert.equal(p.route,'clarify');assert.equal(p.source,'local');assert.equal(called,false);});
test('Jev uses the fixed route catalog; creative invention remains a host task',async()=>{
 const request=workflowDecisionRequest(input('auto'));assert.equal(request.questions.route.type,'choice');assert.ok(request.questions.route.criteria.coding);
 const p=await planWorkflow(input('auto'),{enabled:true,key:'test',fetchImpl:async(url:string,opts:any)=>{assert.equal(url,'https://openrouter.ai/api/alpha/decisions');assert.equal(JSON.parse(opts.body).model,'typesafe/jev-1.14');return {ok:true,json:async()=>({answers:{route:{type:'choice',choice:'creative_direction',confidence:.94}},usage:{cost:.00001}})};}});assert.equal(p.source,'jev');assert.equal(p.status,'host');assert.equal(p.route,'creative_direction');
});
test('malformed, unavailable and uncertain decisions preserve local recovery',async()=>{
 for(const answer of [{type:'choice',choice:'run_shell',confidence:1},{type:'choice',choice:'coding',confidence:2},null]){const p=await planWorkflow(input('auto'),{enabled:true,key:'test',fetchImpl:async()=>({ok:true,json:async()=>({answers:{route:answer}})})});assert.equal(p.source,'fallback');assert.equal(p.status,'needs-input');}
 const uncertain=await planWorkflow(input('auto'),{enabled:true,key:'test',fetchImpl:async()=>({ok:true,json:async()=>({answers:{route:{type:'choice',choice:'scene_actions',confidence:.4}}})})});assert.equal(uncertain.route,'clarify');assert.equal(uncertain.suggestedRoute,'scene_actions');
 const failed=await planWorkflow(input('auto'),{enabled:true,key:'test',fetchImpl:async()=>{throw Error('offline');}});assert.equal(failed.source,'fallback');
});
test('workflow checks prerequisites and rejects unbounded or unknown task data',async()=>{
 assert.equal((await planWorkflow({...input('scene'),state:{...state,references:0}})).next,'add-reference');assert.equal((await planWorkflow({...input('export'),state:{...state,shots:4}})).status,'needs-input');
 await assert.rejects(()=>planWorkflow({...input('edit'),task:'delete-all'}),/Provide/);await assert.rejects(()=>planWorkflow({...input('edit'),state:{...state,objects:-1}}),/summary/);
});
