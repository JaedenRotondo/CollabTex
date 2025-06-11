import type { Handle } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth.js';

// Set the port for Render deployment
if (process.env.PORT) {
	process.env.BODY_SIZE_LIMIT = '10mb';
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('auth-session');

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(sessionId);
	if (session) {
		event.locals.user = user;
		event.locals.session = session;
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};