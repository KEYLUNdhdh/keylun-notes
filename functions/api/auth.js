export async function onRequest({ request, env }) {
	const clientId = env.GITHUB_CLIENT_ID;

	if (!clientId) {
		return new Response('Missing GITHUB_CLIENT_ID', { status: 500 });
	}

	const url = new URL(request.url);
	const redirectUrl = new URL('https://github.com/login/oauth/authorize');
	redirectUrl.searchParams.set('client_id', clientId);
	redirectUrl.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
	redirectUrl.searchParams.set('scope', 'repo user');
	redirectUrl.searchParams.set('state', crypto.randomUUID());

	return Response.redirect(redirectUrl.href, 302);
}
