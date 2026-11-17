import {boardLayout} from './formats.ts';
import {zipSync,strToU8} from 'fflate';
import {png} from './renderOutput.ts';
import {storyboardManifest} from './storyboard.ts';
import type {Project,ShotCard} from './model.ts';
const bytes=(data:string)=>Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));
function wrap(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number,maxLines:number){let line='',row=0;const words=text.split(/\s+/);for(let i=0;i<words.length;i++){const test=(line?line+' ':'')+words[i];if(ctx.measureText(test).width>width&&line){ctx.fillText(line,x,y+row*lineHeight);row++;line=words[i];if(row===maxLines-1){let rest=words.slice(i).join(' ');while(ctx.measureText(rest+'…').width>width&&rest.length)rest=rest.slice(0,-1);ctx.fillText(rest+(i<words.length-1?'…':''),x,y+row*lineHeight);return;}}else line=test;}if(line)ctx.fillText(line,x,y+row*lineHeight);}
export async function exportStoryboard(project:Project,cards:ShotCard[],images:string[],panelImages:Record<string,string>={}):Promise<Blob>{
 if(cards.length!==6||images.length!==6)throw Error('A six-shot storyboard needs six rendered camera frames.');
 const layout=boardLayout(project.frameFormat),manifest=storyboardManifest(project,cards),canvas=document.createElement('canvas');canvas.width=layout.width;canvas.height=layout.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Storyboard canvas is unavailable.');
 ctx.fillStyle='#f5f5f1';ctx.fillRect(0,0,layout.width,layout.height);ctx.fillStyle='#202d32';ctx.font='600 70px sans-serif';ctx.fillText(project.name,120,125);ctx.font='32px sans-serif';ctx.fillText('SCENE ROOM  /  SIX-SHOT STORYBOARD',120,188);ctx.fillStyle='#5d7074';ctx.font='28px sans-serif';wrap(ctx,manifest.layout,120,245,3060,39,2);
 const files:Record<string,Uint8Array>={};
 for(let i=0;i<6;i++){
  const image=new Image();image.src=images[i];await image.decode();const x=120+(i%3)*1040,y=370+Math.floor(i/3)*layout.rowStep,shot=manifest.shots[i];
  ctx.fillStyle='#fff';ctx.fillRect(x,y,980,layout.rowHeight);ctx.drawImage(image,x,y,980,layout.imageHeight);ctx.fillStyle='#20373b';ctx.font='600 38px sans-serif';wrap(ctx,`${String(i+1).padStart(2,'0')}  ${shot.title}`,x+24,y+layout.imageHeight+63.75,932,45,2);
  ctx.font='26px sans-serif';ctx.fillStyle='#4a666b';wrap(ctx,shot.technical,x+24,y+layout.imageHeight+162.75,932,36,3);ctx.fillStyle='#283c42';wrap(ctx,shot.purpose,x+24,y+layout.imageHeight+288.75,932,36,2);
  if(shot.panels.length){const strip=document.createElement('canvas');strip.width=3300;strip.height=layout.stripHeight;const sc=strip.getContext('2d');if(!sc)throw Error('Panel sheet canvas unavailable.');sc.fillStyle='#f5f5f1';sc.fillRect(0,0,3300,layout.stripHeight);sc.fillStyle='#20373b';sc.font='600 58px sans-serif';wrap(sc,`${String(i+1).padStart(2,'0')}  ${shot.title}`,120,110,3060,65,2);
   for(const panel of shot.panels){const frame=panelImages[panel.id];if(!frame)throw Error('A saved panel could not be rendered. The storyboard was not exported.');const roleIndex=['start','middle','end'].indexOf(panel.role),label=`${String(i+1).padStart(2,'0')}${String.fromCharCode(65+roleIndex)}`,x=120+roleIndex*1040,img=new Image();img.src=frame;await img.decode();sc.drawImage(img,x,230,980,layout.imageHeight);sc.font='600 36px sans-serif';sc.fillStyle='#20373b';sc.fillText(`${label} · ${panel.role}${panel.time!==undefined?' · '+panel.time.toFixed(2)+'s':''}`,x,layout.imageHeight+288.75);sc.font='26px sans-serif';wrap(sc,panel.technical,x,layout.imageHeight+348.75,980,35,3);files[`shots/${label}.png`]=bytes(frame);files[`shots/${label}-camera.txt`]=strToU8(`${panel.title} · ${panel.role}\n${panel.time!==undefined?'Time: '+panel.time.toFixed(3)+'s\n':''}${panel.technical}\n${panel.staging}\n`);}
   files[`shots/${String(i+1).padStart(2,'0')}-panels.png`]=new Uint8Array(await(await png(strip)).arrayBuffer());
  }
  files[`shots/${String(i+1).padStart(2,'0')}.png`]=bytes(images[i]);files[`shots/${String(i+1).padStart(2,'0')}-camera.txt`]=strToU8(`${shot.title}\n${shot.technical}\n${shot.staging}\n${shot.purpose}\n\n${manifest.handoff}\n`);
 }
 ctx.fillStyle='#52676d';ctx.font='26px sans-serif';wrap(ctx,'Proxy geometry establishes blocking. Original references establish appearance. Every image uses its saved camera; older shots without a set snapshot use the current set. These six shots are coverage ideas, not an imposed edit.',120,layout.height-110,3060,36,2);
 files['storyboard.png']=new Uint8Array(await (await png(canvas)).arrayBuffer());files['storyboard.json']=strToU8(JSON.stringify(manifest,null,2));
 for(let i=0;i<project.references.length;i++){const r=project.references[i];files[manifest.references[i].path]=bytes(r.data);}
 files['README.txt']=strToU8(manifest.handoff+'\n\nRead storyboard.json for camera data and subject-to-reference identifiers. Keep the appearance references distinct from the rough composition images. The individual PNG files and camera language can be submitted separately when the model does not support a full storyboard sheet.\n');
 return new Blob([zipSync(files,{level:0}) as BlobPart],{type:'application/zip'});
}
