import {sampleTake,uid} from './model.ts';import type {Take,ShotPanel,ShotCard} from './model.ts';
export const panelRoles=['start','middle','end'] as const;
export const shotPinned=(shot:ShotCard)=>shot.pinned??shot.captured;
export function panelsFromTake(take:Take):ShotPanel[]{return panelRoles.map((role,i)=>{const time=take.duration*i/2;return {id:uid(),role,time,takeId:take.id,takeName:take.name,duration:take.duration,pose:sampleTake(take,time),scene:structuredClone(take.scene),room:[...take.room],environment:structuredClone(take.environment),referenceIds:take.references?.map(r=>r.id)??[]};});}
export function panelCamera(panel:ShotPanel,title:string):ShotCard{return {id:panel.id,title,purpose:panel.time!==undefined?`${panel.role} · ${panel.time.toFixed(2)}s${panel.takeName?' · '+panel.takeName:''}`:`${panel.role} · manually framed`,pose:panel.pose,captured:true,scene:panel.scene,room:panel.room,environment:panel.environment,referenceIds:panel.referenceIds};}
