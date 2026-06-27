export const prerender = false;

function renderBody(status: 'success' | 'error', content: unknown) {
	const payload = `authorization:github:${status}:${JSON.stringify(content)}`;
	return `
		<!doctype html>
		<html>
			<body>
				<script>
					const receiveMessage = (message) => {
						window.opener.postMessage(${JSON.stringify(payload)}, message.origin);
						window.removeEventListener('message', receiveMessage, false);
					};
					window.addEventListener('message', receiveMessage, false);
					window.opener.postMessage('authorizing:github', '*');
				</script>
			</body>
		</html>
	`;
}

export async function GET(context) {
	const env = context.locals.runtime?.env ?? {};
	const clientId = env.GITHUB_CLIENT_ID;
	const clientSecret = env.GITHUB_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return new Response('Missing GitHub OAuth environment variables', { status: 500 });
	}

	const url = new URL(context.request.url);
	const code = url.searchParams.get('code');

	if (!code) {
		return new Response('Missing OAuth code', { status: 400 });
	}

	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			'user-agent': 'keylun-notes-decap-oauth',
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code,
		}),
	});

	const result = await response.json();

	if (result.error) {
		return new Response(renderBody('error', result), {
			headers: { 'content-type': 'text/html;charset=UTF-8' },
			status: 401,
		});
	}

	return new Response(
		renderBody('success', {
			token: result.access_token,
			provider: 'github',
		}),
		{
			headers: { 'content-type': 'text/html;charset=UTF-8' },
			status: 200,
		},
	);
}
