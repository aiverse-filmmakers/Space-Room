import {defineConfig} from 'vite';
import {handleApi} from './api.mjs';
export default defineConfig({plugins:[{name:'scene-room-local-api',configureServer(server){server.middlewares.use(async(req,res,next)=>{if(!await handleApi(req,res))next();});}}],server:{host:'127.0.0.1',port:4317,strictPort:true,watch:{ignored:['**/dist/**']}},build:{rolldownOptions:{output:{codeSplitting:{groups:[{name:'three',test:/node_modules\/three/},{name:'react',test:/node_modules\/(react|react-dom|scheduler)/}]}}}}});
