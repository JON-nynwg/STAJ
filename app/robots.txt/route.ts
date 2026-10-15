import { siteOrigin } from '@/lib/site';
export const dynamic='force-dynamic';
export async function GET(){return new Response(`User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${await siteOrigin()}/sitemap.xml\n`,{headers:{'content-type':'text/plain; charset=utf-8'}});}
