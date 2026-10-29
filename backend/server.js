import {mkdirSync} from 'node:fs';
import {createApp} from './app.js';
mkdirSync('data',{recursive:true});
const {app,db}=createApp({database:process.env.DATABASE_PATH||'data/nexo.db',seed:process.env.SEED_DEMO==='true'||process.env.NODE_ENV!=='production'});
const server=app.listen(Number(process.env.PORT)||3001,'0.0.0.0',()=>console.log('Nexo API disponible en http://localhost:'+(process.env.PORT||3001)));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
