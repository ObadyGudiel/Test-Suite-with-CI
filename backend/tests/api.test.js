import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {createApp} from '../app.js';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('authenticated database workflow, validation, audit and persistence', async () => {
 const {app,db}=createApp({database:':memory:',seed:true});
 const agent=request.agent(app);
 try {
  await agent.get('/api/workspace').expect(401);
  await agent.post('/api/login').send({email:'admin@nexo.local',password:'wrong'}).expect(401);
  await agent.post('/api/login').send({email:'admin@nexo.local',password:'NexoDemo2026!'}).expect(200);
  const project=(await agent.post('/api/projects').send({name:'Integración',description:'Proyecto de prueba',color:'#267566'}).expect(201)).body;
  await agent.post('/api/tasks').send({title:' ',projectId:project.id}).expect(400);
  await agent.post('/api/tasks').send({title:'Orphan',projectId:'missing'}).expect(404);
  const task=(await agent.post('/api/tasks').send({title:'Validar flujo',projectId:project.id}).expect(201)).body;
  await agent.patch('/api/tasks/'+task.id).send({status:'done',title:'Entrega validada'}).expect(200);
  const state=(await agent.get('/api/workspace').expect(200)).body;
  assert.equal(state.tasks.find(t=>t.id===task.id).status,'done');
  assert.equal(db.prepare('SELECT title FROM tasks WHERE id=?').get(task.id).title,'Entrega validada');
  assert.ok(state.activity.some(a=>a.action.includes('Entrega validada')));
  await agent.delete('/api/tasks/'+task.id).expect(204);
  await agent.patch('/api/tasks/'+task.id).send({status:'done'}).expect(404);
  await agent.post('/api/logout').expect(204); await agent.get('/api/workspace').expect(401);
 } finally {db.close();}
});
test('rejects invalid updates, cross-site mutations, unauthenticated writes and unknown routes',async()=>{
 const {app,db}=createApp({database:':memory:',seed:true});const agent=request.agent(app);
 try{
  await agent.post('/api/tasks').send({title:'Unauthorized',projectId:'p1'}).expect(401);
  await agent.post('/api/login').send({email:[],password:42}).expect(400);
  await agent.post('/api/login').send({email:'admin@nexo.local',password:'NexoDemo2026!'}).expect(200);
  await agent.post('/api/projects').set('Sec-Fetch-Site','cross-site').send({name:'Blocked'}).expect(403);
  await agent.post('/api/projects').send({name:'Invalid',color:'not-a-color'}).expect(400);
  const state=(await agent.get('/api/workspace')).body;const task=state.tasks[0];
  for(const body of [{status:'invalid'},{dueDate:'2026-02-30'},{title:'   '},{priority:'urgent'}])await agent.patch('/api/tasks/'+task.id).send(body).expect(400);
  await agent.patch('/api/tasks/'+task.id).send({projectId:'missing'}).expect(404);
  const after=(await agent.get('/api/workspace')).body;
  assert.deepEqual(after.tasks.find(t=>t.id===task.id),task);assert.equal(after.activity.length,0);
  await agent.post('/api/projects').set('Content-Type','application/json').send('{invalid').expect(400);
  await agent.get('/api/missing').expect(404);
 }finally{db.close();}
});
test('database preserves projects and tasks after closing and reopening the connection',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'nexo-test-'));const database=join(directory,'test.db');let instance=createApp({database,seed:false});
 try{
  let agent=request.agent(instance.app);await agent.post('/api/login').send({email:'admin@nexo.local',password:'NexoDemo2026!'}).expect(200);
  const p=(await agent.post('/api/projects').send({name:'Persistent'}).expect(201)).body;
  const t=(await agent.post('/api/tasks').send({title:'Survives restart',projectId:p.id}).expect(201)).body;
  instance.db.close();instance=createApp({database,seed:false});agent=request.agent(instance.app);
  await agent.post('/api/login').send({email:'admin@nexo.local',password:'NexoDemo2026!'}).expect(200);
  const state=(await agent.get('/api/workspace').expect(200)).body;assert.equal(state.tasks[0].id,t.id);assert.equal(state.projects[0].id,p.id);
 }finally{instance.db.close();rmSync(directory,{recursive:true,force:true});}
});
