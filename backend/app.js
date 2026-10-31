import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {openDatabase} from './database.js';
import {taskSchema,projectSchema,summarize,verifyPassword} from './domain.js';
export function createApp({database='data/nexo.db',seed=false}={}) {
 const db=openDatabase(database,seed); const app=express();app.disable('x-powered-by');app.use(helmet()); app.use(express.json({limit:'32kb'}));
 app.use('/api', (req,res,next)=>{if(['POST','PATCH','DELETE'].includes(req.method) && req.headers['sec-fetch-site']==='cross-site')return res.status(403).json({error:'Origen no permitido'});next();});
 app.get('/api/health',(_req,res)=>res.json({status:'ok'}));
 const digest=token=>createHash('sha256').update(token).digest('hex');
 app.post('/api/login',rateLimit({windowMs:60000,limit:20}), (req,res)=>{
  const {email,password}=req.body||{};if(typeof email!=='string'||typeof password!=='string'||password.length>256)return res.status(400).json({error:'Datos de acceso inválidos'});
  const user=db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase().trim());
  if(!user||!verifyPassword(password,user.password))return res.status(401).json({error:'Correo o contraseña incorrectos'});
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now()); const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),user.id,Date.now()+86400000);
  res.cookie('nexo_session',token,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:86400000,path:'/'}).json({name:user.name,email:user.email});
 });
 app.use('/api',(req,res,next)=>{
  const token=req.headers.cookie?.split(';').map(c=>c.trim()).find(c=>c.startsWith('nexo_session='))?.slice(13);
  const user=token&&db.prepare('SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.userId WHERE s.token=? AND s.expires>?').get(digest(token),Date.now());
  if(!user)return res.status(401).json({error:'Inicia sesión para continuar'}); req.user=user; req.session=digest(token);next();
 });
 const audit=(req,action)=>db.prepare('INSERT INTO activity VALUES(?,?,?,?)').run(randomUUID(),action,req.user.name,new Date().toISOString());
 const transaction=fn=>{db.exec('BEGIN');try{const value=fn();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}};
 app.post('/api/logout',(req,res)=>{db.prepare('DELETE FROM sessions WHERE token=?').run(req.session);res.clearCookie('nexo_session',{path:'/'}).sendStatus(204);});
 app.get('/api/workspace',(req,res)=>{const tasks=db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all();res.json({user:req.user,projects:db.prepare('SELECT * FROM projects ORDER BY rowid').all(),tasks,metrics:summarize(tasks),activity:db.prepare('SELECT * FROM activity ORDER BY rowid DESC LIMIT 30').all()});});
 app.post('/api/projects',(req,res)=>{const parsed=projectSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Revisa el nombre y los datos del proyecto'});const p={id:randomUUID(),...parsed.data};transaction(()=>{db.prepare('INSERT INTO projects VALUES(?,?,?,?)').run(p.id,p.name,p.description,p.color);audit(req,`Creó el proyecto ${p.name}`);});res.status(201).json(p);});
 app.delete('/api/projects/:id',(req,res)=>{const project=db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);if(!project)return res.status(404).json({error:'Proyecto no encontrado'});transaction(()=>{db.prepare('DELETE FROM tasks WHERE projectId=?').run(project.id);db.prepare('DELETE FROM projects WHERE id=?').run(project.id);audit(req,`Eliminó el proyecto ${project.name} y sus tareas asociadas`);});res.sendStatus(204);});
 app.post('/api/tasks',(req,res)=>{const parsed=taskSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Revisa el título, la prioridad y la fecha'});const t={id:randomUUID(),...parsed.data,createdAt:new Date().toISOString()};if(!db.prepare('SELECT id FROM projects WHERE id=?').get(t.projectId))return res.status(404).json({error:'Proyecto no encontrado'});transaction(()=>{db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?,?)').run(t.id,t.title,t.description,t.projectId,t.status,t.priority,t.assignee,t.dueDate,t.createdAt);audit(req,`Creó la tarea ${t.title}`);});res.status(201).json(t);});
 app.patch('/api/tasks/:id',(req,res)=>{const current=db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);if(!current)return res.status(404).json({error:'Tarea no encontrada'});const parsed=taskSchema.safeParse({...current,...req.body});if(!parsed.success)return res.status(400).json({error:'Datos de tarea inválidos'});const t=parsed.data;if(!db.prepare('SELECT id FROM projects WHERE id=?').get(t.projectId))return res.status(404).json({error:'Proyecto no encontrado'});transaction(()=>{db.prepare('UPDATE tasks SET title=?,description=?,projectId=?,status=?,priority=?,assignee=?,dueDate=? WHERE id=?').run(t.title,t.description,t.projectId,t.status,t.priority,t.assignee,t.dueDate,current.id);audit(req,`Actualizó la tarea ${t.title}`);});res.json({...current,...t});});
 app.delete('/api/tasks/:id',(req,res)=>{const t=db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);if(!t)return res.status(404).json({error:'Tarea no encontrada'});transaction(()=>{db.prepare('DELETE FROM tasks WHERE id=?').run(t.id);audit(req,`Eliminó la tarea ${t.title}`);});res.sendStatus(204);});
 app.use('/api',(_req,res)=>res.status(404).json({error:'Endpoint no encontrado'}));
 app.use(express.static(resolve('dist')));app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/index.html')));
 app.use((err,req,res,_next)=>{if(err instanceof SyntaxError)return res.status(400).json({error:'JSON inválido'});console.error(err.message);res.status(500).json({error:'No se pudo completar la operación'});});
 return {app,db};
}

