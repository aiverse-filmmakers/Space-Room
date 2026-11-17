import test from 'node:test';
import assert from 'node:assert/strict';
import {createOperatorStore} from '../operatorStore.mjs';

const ref={id:'ref-a',name:'flower.png',data:'data:image/png;base64,YWJj'};
const context={schema:'scene-room.host-context.v1',revision:'rev-1',scene:{objects:[],references:[{id:ref.id,name:ref.name}]}};
test('opt-in project sharing exposes selected image only while a live tab is present',()=>{
 let now=1000;const store=createOperatorStore(()=>now);
 assert.throws(()=>store.summary(),/No live/);
 store.share({projectId:'project-one',context,references:[ref]});
 assert.equal(store.summary().references[0].name,'flower.png');
 assert.equal(store.image('ref-a').data,'YWJj');
 assert.throws(()=>store.image('missing'),/not found/);
 now+=26000;assert.throws(()=>store.summary(),/No live/);
});
test('proposals cannot bypass project revision, user approval, or project switch',()=>{
 let now=1000;const store=createOperatorStore(()=>now);
 store.share({projectId:'project-one',context,references:[ref]});
 assert.throws(()=>store.enqueue('scene','stale',{objects:[]}),/Scene changed/);
 const proposed=store.enqueue('scene','rev-1',{objects:[]});
 assert.equal(store.receipt(proposed.id).status,'awaiting_approval');
 assert.throws(()=>store.enqueue('scene','rev-1',{objects:[]}),/already/);
 assert.equal(store.pending().id,proposed.id);
 store.resolve({id:proposed.id,status:'rejected',message:'Not the right flower'});
 assert.equal(store.receipt(proposed.id).status,'rejected');
 assert.equal(store.pending(),null);
 const p=store.enqueue('actions','rev-1',{schema:'scene-room.actions.v1',baseRevision:'rev-1',actions:[{type:'object.update'}]});
 store.share({projectId:'another',context,references:[]});
 assert.equal(store.pending(),null);
 assert.equal(store.receipt(p.id).status,'unknown');
 assert.deepEqual(store.summary().references,[]);
 store.revoke();assert.throws(()=>store.summary(),/No live/);
});
test('invalid image bytes and invalid action envelopes are rejected',()=>{
 const store=createOperatorStore();assert.throws(()=>store.share({projectId:'bad/dir',context,references:[]}),/Invalid/);
 assert.throws(()=>store.share({projectId:'valid',context,references:[{...ref,data:'file:///etc/passwd'}]}),/Unsupported/);
 store.share({projectId:'valid',context,references:[]});
 assert.throws(()=>store.enqueue('actions','rev-1',{schema:'arbitrary',actions:[]}),/Actions require/);
});
