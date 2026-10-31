import {spawn} from 'node:child_process';
import cypress from 'cypress';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const urls=['http://127.0.0.1:3001/api/health','http://127.0.0.1:5173'];
const processes=[];
const directory=mkdtempSync(join(tmpdir(),'nexo-e2e-'));
try {
 for(const url of urls){let running=false;try{await fetch(url,{signal:AbortSignal.timeout(700)});running=true;}catch{}if(running)throw new Error('El puerto ya está ocupado: '+url+'. Detén la instancia antes de ejecutar E2E.');}
 for(const args of [['backend/server.js'],['node_modules/vite/bin/vite.js','--host','127.0.0.1','--strictPort']])processes.push(spawn(process.execPath,args,{stdio:'inherit',env:{...process.env,NODE_ENV:'test',DATABASE_PATH:join(directory,'e2e.db'),ADMIN_EMAIL:'obadygudiel@gmail.com',ADMIN_PASSWORD:'obady123'}}));
 for(const url of urls){let ready=false;for(let i=0;i<60;i++){try{const response=await fetch(url,{signal:AbortSignal.timeout(1000)});if(response.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}if(!ready)throw new Error('No se pudo iniciar '+url);}
 const results=await cypress.run();process.exitCode=results.totalFailed||results.failures?1:0;
}catch(error){console.error(error.message);process.exitCode=1;}finally{await Promise.all(processes.map(child=>new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);child.kill();})));rmSync(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
