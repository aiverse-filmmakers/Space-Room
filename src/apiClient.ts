// Ephemeral local bridge authentication. No credential is stored in GitHub, in a project, or in browser storage.
let token:string|null=null;
const bridge='http://127.0.0.1:4317';
const locallyHosted=()=>location.hostname==='localhost'||location.hostname==='127.0.0.1';
export const bridgeConnected=()=>!!token;
export const hostedWithoutBridge=()=>!locallyHosted()&&!token;
export async function connectBridge(code:string):Promise<{configured:boolean;enabled:boolean;model:string;generationEnabled?:boolean;decisionsEnabled?:boolean}>{
 if(!/^[0-9A-F]{12}$/i.test(code.trim()))throw Error('Enter the 12-character code displayed by the Mac bridge.');
 const res=await fetch(bridge+'/api/bridge/pair',{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code.trim().toUpperCase()})});
 const body=await res.json();
 if(!res.ok||typeof body.token!=='string')throw Error(body.error||'Could not pair with the Mac bridge.');
 token=body.token;
 const status=await apiFetch('/api/status');
 if(!status.ok){token=null;throw Error('The local AI Bridge could not be verified.');}
 return status.json();
}
export async function apiFetch(path:string,init?:RequestInit):Promise<Response>{
 if(!path.startsWith('/api/'))throw Error('Unsupported API path.');
 if(locallyHosted())return fetch(path,init);
 if(!token)throw Error('Connect the local AI Bridge in Settings to enable paid generation. All 3D tools work without it.');
 const headers=new Headers(init?.headers);headers.set('X-Scene-Room-Token',token);
 return fetch(bridge+path,{...init,headers,mode:'cors',credentials:'omit',cache:'no-store'});
}
export function disconnectBridge(){token=null;}
