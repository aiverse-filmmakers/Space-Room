import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const label='com.aiverse.scene-room';
const domain=`gui/${process.getuid()}`;
const target=`${domain}/${label}`;
const dir=join(root,'artifacts/service');
const plist=join(dir,`${label}.plist`);
const url='http://127.0.0.1:4317/';
const run=(...args)=>spawnSync('/bin/launchctl',args,{encoding:'utf8'});
const registered=()=>run('print',target).status===0;
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
async function health(){try{const r=await fetch(url+'api/status',{signal:AbortSignal.timeout(1000)});const s=await r.json();return r.ok&&s.provider==='OpenRouter'&&!s.enabled&&!s.decisionsEnabled;}catch{return false;}}
async function main(){
 const action=process.argv[2];
 if(action==='pair'){
  const code=readFileSync(join(dir,'pair-code'),'utf8').trim();
  console.log('Space Room browser connection code: '+code);
  spawnSync('/usr/bin/osascript',['-e',`display dialog "Enter this code in Space Room > Settings: ${code}" buttons {"OK"} default button "OK" with title "Scene Room Local AI Bridge"`]);
  return;
 }
 if(action==='stop'){
  if(!registered()){console.log('Scene Room service is already stopped.');return;}
  const result=run('bootout',target);if(result.status!==0)throw Error(result.stderr);
  console.log('Scene Room stopped. Your saved projects remain available.');return;
 }
 if(action!=='start')throw Error('Use: node service.mjs start|stop');
 if(!existsSync(join(root,'dist/index.html')))throw Error('Build first: npm run build');
 if(!registered()){
  try{await fetch(url,{signal:AbortSignal.timeout(1000)});throw Error('Port 4317 is already in use. Stop the existing Scene Room development server first.');}catch(e){if(e.message.startsWith('Port '))throw e;}
  mkdirSync(dir,{recursive:true});
  const str=s=>`<string>${escape(s)}</string>`;
  writeFileSync(plist,`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key>${str(label)}<key>ProgramArguments</key><array>${str(process.execPath)}${str(join(root,'server.mjs'))}</array><key>WorkingDirectory</key>${str(root)}<key>RunAtLoad</key><true/><key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict><key>ThrottleInterval</key><integer>5</integer><key>EnvironmentVariables</key><dict><key>PORT</key>${str('4317')}<key>SCENE_ROOM_ALLOW_PAID_AI</key>${str('0')}<key>SCENE_ROOM_ALLOW_GENERATION</key>${str('1')}<key>SCENE_ROOM_GENERATION_PROVIDER</key>${str('kie')}<key>SCENE_ROOM_ALLOW_JEV</key>${str('0')}<key>SCENE_ROOM_BRIDGE_ENABLED</key>${str('1')}<key>SCENE_ROOM_BRIDGE_ORIGIN</key>${str('https://aiverse-filmmakers.github.io')}</dict><key>StandardOutPath</key>${str(join(dir,'stdout.log'))}<key>StandardErrorPath</key>${str(join(dir,'stderr.log'))}</dict></plist>\n`);
  const result=run('bootstrap',domain,plist);if(result.status!==0)throw Error(result.stderr||'Could not start service');
 }
 for(let i=0;i<100;i++){if(await health()){console.log(`Scene Room is running independently: ${url}`);if(!process.argv.includes('--no-open'))spawnSync('/usr/bin/open',[url]);return;}await new Promise(r=>setTimeout(r,300));}
 throw Error(`Server did not become ready. Check ${dir}/stderr.log`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
