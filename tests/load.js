import http from 'k6/http';
import {check,sleep} from 'k6';
export const options={stages:[{duration:'10s',target:10},{duration:'20s',target:20},{duration:'10s',target:0}],thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<500'],checks:['rate>0.99']}};
const base=__ENV.BASE_URL||'http://127.0.0.1:3001';
export function setup(){const response=http.post(base+'/api/login',JSON.stringify({email:__ENV.LOAD_EMAIL||'obadygudiel@gmail.com',password:__ENV.LOAD_PASSWORD||'obady123'}),{headers:{'Content-Type':'application/json'}});if(response.status!==200)throw new Error('No se pudo autenticar la prueba');return {token:response.cookies.nexo_session[0].value};}
export default function({token}){const response=http.get(base+'/api/workspace',{headers:{Cookie:'nexo_session='+token}});check(response,{'workspace responde 200':r=>r.status===200,'contrato de respuesta válido':r=>{try{return Array.isArray(r.json('tasks'))&&r.json('metrics.total')>=0;}catch{return false;}}});sleep(.3);}
export function teardown({token}){http.post(base+'/api/logout',null,{headers:{Cookie:'nexo_session='+token}});}
