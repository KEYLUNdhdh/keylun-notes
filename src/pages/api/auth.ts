export const prerender = false;

function getEnv(context) {
	return (
		context.locals?.runtime?.env ??
		context.locals?.cloudflare?.env ??
		context.env ??
		{}
	);
}

export async function GET(context) {
	const env = getEnv(context);
	const clientId = env.GITHUB_CLIENT_ID;

	if (!clientId) {
		return new Response('Missing GITHUB_CLIENT_ID', { status: 500 });
	}

	const url = new URL(context.request.url);
	const redirectUrl = new URL('https://github.com/login/oauth/authorize');
	redirectUrl.searchParams.set('client_id', clientId);
	redirectUrl.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
	redirectUrl.searchParams.set('scope', 'repo user');
	redirectUrl.searchParams.set('state', crypto.randomUUID());

	return Response.redirect(redirectUrl.href, 302);
}
