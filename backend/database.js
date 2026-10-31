import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {hashPassword} from './domain.js';
export function openDatabase(path,seed) {
 const db=new DatabaseSync(path); db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,userId TEXT REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL,color TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL,projectId TEXT NOT NULL REFERENCES projects(id),status TEXT NOT NULL,priority TEXT NOT NULL,assignee TEXT NOT NULL,dueDate TEXT NOT NULL,createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS activity(id TEXT PRIMARY KEY,action TEXT NOT NULL,actor TEXT NOT NULL,createdAt TEXT NOT NULL);`);
 if(!db.prepare('SELECT id FROM users LIMIT 1').get()) {
  const password=process.env.ADMIN_PASSWORD || (process.env.NODE_ENV==='production'?null:'obady123');
  if(!password || (process.env.NODE_ENV==='production'&&password.length<12)) throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres en producción');
  db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(randomUUID(),'Obady Pérez',process.env.ADMIN_EMAIL||'obadygudiel@gmail.com',hashPassword(password));
 }
 if(process.env.NODE_ENV!=='production'&&!process.env.ADMIN_EMAIL&&!process.env.ADMIN_PASSWORD){
  const legacy=db.prepare("SELECT id FROM users WHERE email='admin@nexo.local'").get();
  if(legacy)db.prepare('UPDATE users SET name=?,email=?,password=? WHERE id=?').run('Obady Pérez','obadygudiel@gmail.com',hashPassword('obady123'),legacy.id);
 }
 db.prepare("UPDATE tasks SET assignee='' WHERE assignee='Alex Morgan'").run();
 if(seed && !db.prepare('SELECT id FROM projects LIMIT 1').get()) {
  const projects=[['p1','Plataforma digital','La próxima generación de nuestra experiencia digital.','#5362A7'],['p2','Identidad de marca','Una identidad consistente en cada punto de contacto.','#AD5C8E'],['p3','Operaciones internas','Procesos simples para equipos extraordinarios.','#D4775C']];
  const insert=db.prepare('INSERT INTO projects VALUES(?,?,?,?)'); projects.forEach(p=>insert.run(...p));
  const titles=['Diseñar el nuevo dashboard','Definir arquitectura de la API','Revisar experiencia de onboarding','Preparar sistema de componentes','Validar accesibilidad del portal','Publicar guía de marca','Optimizar consultas de datos','Automatizar reporte semanal','Revisar entregables del sprint','Configurar entorno de integración','Actualizar biblioteca visual','Documentar flujo de aprobación'];
  const statement=db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?,?)');
  titles.forEach((title,i)=>{const due=new Date();due.setDate(due.getDate()+i-3); statement.run(randomUUID(),title,'Coordinar la ejecución con el equipo y validar los criterios de aceptación.',projects[i%3][0],['todo','progress','review','done'][i%4],['high','medium','low'][i%3],['','Sofía Torres','Daniel Ruiz','Valentina López'][i%4],due.toISOString().slice(0,10),new Date().toISOString());});
 }
 return db;
}

