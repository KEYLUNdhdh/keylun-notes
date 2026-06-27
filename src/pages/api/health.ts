export const prerender = false;

export function GET() {
	return new Response('ok', {
		headers: {
			'content-type': 'text/plain;charset=UTF-8',
		},
	});
}
