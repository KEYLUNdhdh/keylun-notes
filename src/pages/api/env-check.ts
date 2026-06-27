export const prerender = false;

function getEnv(context) {
	return (
		context.locals?.runtime?.env ??
		context.locals?.cloudflare?.env ??
		context.env ??
		{}
	);
}

export function GET(context) {
	const env = getEnv(context);
	return Response.json({
		hasClientId: Boolean(env.GITHUB_CLIENT_ID),
		hasClientSecret: Boolean(env.GITHUB_CLIENT_SECRET),
		keys: Object.keys(env).filter((key) => key.startsWith('GITHUB_') || key === 'SITE'),
	});
}
