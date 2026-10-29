import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
const date = z.string().refine(v => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v), 'Fecha inválida');
export const taskSchema = z.object({title:z.string().trim().min(1).max(160),description:z.string().max(2000).default(''),projectId:z.string().min(1),status:z.enum(['todo','progress','review','done']).default('todo'),priority:z.enum(['low','medium','high']).default('medium'),assignee:z.string().max(80).default('Sin asignar'),dueDate:date.default('')});
export const projectSchema = z.object({name:z.string().trim().min(1).max(80),description:z.string().max(300).default(''),color:z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#5362A7')});
export function summarize(tasks) {const today=new Date().toISOString().slice(0,10); const completed=tasks.filter(t=>t.status==='done').length; return {total:tasks.length,completed,active:tasks.length-completed,overdue:tasks.filter(t=>t.status!=='done' && t.dueDate && t.dueDate<today).length};}
export function hashPassword(password) {const salt=randomBytes(16).toString('hex'); return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function verifyPassword(password,hash) {const [salt,key]=hash.split(':');return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(key,'hex'));}
