import {test} from 'node:test';
import assert from 'node:assert/strict';
import {download,setExportSink} from '../src/model.ts';

test('project exports are routed to selected workspace sink without triggering browser download',async()=>{
 let called=false;
 const received=new Promise<void>((resolve,reject)=>{
  setExportSink(async(name,blob)=>{
   try{
    assert.equal(name,'shot-sequence.zip');
    assert.equal(blob.type,'application/zip');
    assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())],[10,20,30]);
    called=true;resolve();
   }catch(e){reject(e);}
  });
 });
 try{
  download('shot-sequence.zip',new Uint8Array([10,20,30]),'application/zip');
  await received;
  assert.equal(called,true);
 }finally{setExportSink(null);}
});
