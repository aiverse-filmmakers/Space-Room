// Isolated no-network browser contract fixture. Never imported by the application.
import {createServer} from 'node:http';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,extname} from 'node:path';import {fileURLToPath} from 'node:url';import {GenerationService} from '../generation.mjs';
const app=fileURLToPath(new URL('../',import.meta.url)),out=resolve(app,'exports/mvp-qc/frame-images');mkdirSync(out,{recursive:true});
const params={input_references:{max:8},aspect_ratio:{values:['16:9','9:16','1:1']},n:{min:1,max:1}};const calls=[];
const service=new GenerationService({root:resolve(out,'jobs'),enabled:true,key:'fixture-not-a-credential',imageModel:'qc/model-a',fetchImpl:async(url,opts)=>{
 if(url.endsWith('/images/models'))return {ok:true,json:async()=>({data:['a','b'].map(x=>({id:`qc/model-${x}`,name:`QC fixture model ${x.toUpperCase()}`,supported_parameters:params}))})};
 if(url.endsWith('/endpoints'))return {ok:true,json:async()=>({endpoints:[{provider_tag:'qc-fixture',supported_parameters:params}]})};
 if(!url.endsWith('/images'))throw Error('Fixture refuses network route');const payload=JSON.parse(opts.body);calls.push({model:payload.model,prompt:payload.prompt,aspectRatio:payload.aspect_ratio});writeFileSync(resolve(out,'fixture-calls.json'),JSON.stringify(calls,null,2));
 if(payload.prompt.includes('QC_FAIL'))return {ok:false,status:422,json:async()=>({error:{message:'Intentional QC rejection; previous images retained'}})};
 return {ok:true,json:async()=>({data:[{b64_json:payload.input_references.at(-1).image_url.url.split(',')[1]}],usage:{cost:0}})};
}});
createServer(async(req,res)=>{try{res.setHeader('Content-Type','application/json');
 if(req.url==='/api/status')return res.end(JSON.stringify({provider:'QC fixture',configured:true,enabled:false,generationEnabled:true,decisionsEnabled:false}));
 if(req.url==='/api/generation/image-models')return res.end(JSON.stringify(await service.imageModels()));
 if(req.url==='/api/generation/jobs'&&req.method==='POST'){let text='';for await(const chunk of req)text+=chunk;return res.end(JSON.stringify(await service.submit(JSON.parse(text))));}
 const match=req.url.match(/^\/api\/generation\/jobs\/([\w-]+)(?:\/(content|refresh|package))?$/);if(match){const [,id,action]=match;if(action==='content'){const content=service.content(id);res.setHeader('Content-Type',content.mime);return res.end(content.bytes);}if(action==='package'){res.setHeader('Content-Type','application/zip');return res.end(service.package(id));}return res.end(JSON.stringify(action==='refresh'?await service.refresh(id):service.public(service.read(id))));}
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),root=resolve(app,'dist'),path=pathname==='/'?resolve(root,'index.html'):resolve(root,'.'+pathname);if(!path.startsWith(root+'/'))throw Error('Invalid static path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(path)]||'application/octet-stream');res.end(readFileSync(path));
 }catch(e){res.writeHead(400);res.end(JSON.stringify({error:e.message}));}}).listen(4322,'127.0.0.1',()=>console.log('No-network frame-image QC fixture: http://127.0.0.1:4322/'));
