export const prerender = false;

import { env } from 'cloudflare:workers';

export function GET() {
	return Response.json({
		hasClientId: Boolean(env.GITHUB_CLIENT_ID),
		hasClientSecret: Boolean(env.GITHUB_CLIENT_SECRET),
		keys: Object.keys(env).filter((key) => key.startsWith('GITHUB_') || key === 'SITE'),
	});
}
