import { query, safe, json } from '@/lib/server';
export async function GET(){return safe(async()=>json(await query('SELECT id,slug,name,category,location,description FROM businesses WHERE status=\'approved\' ORDER BY created_at DESC LIMIT 100')));}
