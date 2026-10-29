import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taskSchema, summarize, hashPassword, verifyPassword } from '../domain.js';
test('validates and trims task titles; rejects invalid priorities and dates', () => {
  assert.equal(taskSchema.parse({title:'  Preparar entrega  ',projectId:'p1'}).title,'Preparar entrega');
  for (const data of [{title:' '},{title:'x',priority:'invalid'},{title:'x',dueDate:'2026-02-30'}]) assert.equal(taskSchema.safeParse({...data,projectId:'p1'}).success,false);
});
test('metrics count completed tasks and exclude completed overdue tasks', () => {
  assert.deepEqual(summarize([{status:'done',dueDate:'2020-01-01'},{status:'todo',dueDate:'2020-01-01'},{status:'progress',dueDate:''}]),{total:3,completed:1,active:2,overdue:1});
});
test('password hashes are salted and reject wrong passwords', () => {
  const hash=hashPassword('Strong-password-123'); assert.notEqual(hash,hashPassword('Strong-password-123'));
  assert.equal(verifyPassword('Strong-password-123',hash),true); assert.equal(verifyPassword('wrong',hash),false);
});
