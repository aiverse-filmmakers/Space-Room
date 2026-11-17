import {createServer} from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {handleApi} from './api.mjs';
const root=resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
export function serveStatic(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 let file=resolve(root,'.'+path);
 if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
 try{if(!statSync(file).isFile())throw Error();}catch{if(extname(path)){res.writeHead(404);res.end();return;}file=resolve(root,'index.html');}
 try{const info=statSync(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':info.size,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);}catch{res.writeHead(503);res.end('Build Scene Room first: npm run build');}
}
const server=createServer(async(req,res)=>{try{if(!await handleApi(req,res))serveStatic(req,res);}catch{if(!res.headersSent)res.writeHead(500);res.end('Request failed');}});
const port=Number(process.env.PORT||4317);
server.listen(port,'127.0.0.1',()=>console.log(`Scene Room: http://127.0.0.1:${port}/`));
