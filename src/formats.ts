export const frameFormats={
 '16:9':{ratio:16/9,label:'16:9 · Landscape'},
 '9:16':{ratio:9/16,label:'9:16 · Portrait'},
 '1:1':{ratio:1,label:'1:1 · Square'},
 '4:3':{ratio:4/3,label:'4:3 · Classic'},
 '4:5':{ratio:4/5,label:'4:5 · Portrait'},
 '3:2':{ratio:3/2,label:'3:2 · Photo'},
 '1.85:1':{ratio:1.85,label:'1.85:1 · Cinema'},
 '21:9':{ratio:21/9,label:'21:9 · Ultrawide'},
 '2.39:1':{ratio:2.39,label:'2.39:1 · Cinema scope'},
 '2.76:1':{ratio:2.76,label:'2.76:1 · Ultra scope'}
} as const;
export type FrameFormat=keyof typeof frameFormats;
export function frameSpec(format:FrameFormat='16:9',edge=1280){
 const ratio=frameFormats[format].ratio;
 const even=(n:number)=>Math.max(2,Math.round(n/2)*2);
 return {format,ratio,width:even(ratio>=1?edge:edge*ratio),height:even(ratio>=1?edge/ratio:edge)};
}
// Match Three.js filmGauge=36: the long sensor dimension remains 36 mm.
export function sensorSize(aspect=16/9){return {width:36*Math.min(aspect,1),height:36/Math.max(aspect,1)};}
export function boardLayout(format:FrameFormat='16:9'){
 const imageHeight=980/frameSpec(format).ratio,rowHeight=imageHeight+373.75;
 return {width:3300,height:Math.ceil(370+2*(rowHeight+75)+180),imageHeight,rowHeight,rowStep:rowHeight+75,stripHeight:Math.ceil(imageHeight+548.75)};
}
