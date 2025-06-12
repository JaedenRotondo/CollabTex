import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project, projectShare } from '$lib/server/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

async function checkProjectAccess(
	roomId: string,
	userId: string | undefined,
	requireEdit: boolean = false
) {
	// Get project
	const projects = await db.select().from(project).where(eq(project.roomId, roomId));

	if (projects.length === 0) {
		return { error: 'Project not found', status: 404 };
	}

	const projectData = projects[0];

	// If no user, check for public access
	if (!userId) {
		const publicShares = await db
			.select()
			.from(projectShare)
			.where(
				and(eq(projectShare.projectId, projectData.id), isNull(projectShare.sharedWithUserId))
			);

		if (publicShares.length === 0) {
			return { error: 'Unauthorized', status: 401 };
		}

		if (requireEdit && publicShares[0].permission !== 'edit') {
			return { error: 'Forbidden', status: 403 };
		}

		return { project: projectData, permission: publicShares[0].permission };
	}

	// Check if user is owner
	if (projectData.ownerId === userId) {
		return { project: projectData, permission: 'owner' };
	}

	// Check if project is shared with user
	const shares = await db
		.select()
		.from(projectShare)
		.where(
			and(
				eq(projectShare.projectId, projectData.id),
				or(eq(projectShare.sharedWithUserId, userId), isNull(projectShare.sharedWithUserId))
			)
		);

	if (shares.length === 0) {
		return { error: 'Access denied', status: 403 };
	}

	const share = shares[0];
	if (requireEdit && share.permission !== 'edit') {
		return { error: 'Forbidden - edit permission required', status: 403 };
	}

	return { project: projectData, permission: share.permission };
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const { roomId } = params;

	try {
		// Check access
		const access = await checkProjectAccess(roomId, locals.user?.id);
		if ('error' in access) {
			return json({ error: access.error }, { status: access.status });
		}

		const projectData = access.project;

		return json({
			content: projectData.content || ''
		});
	} catch (error) {
		console.error('Error fetching project content:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const { roomId } = params;

	try {
		const body = await request.json();
		const { content } = body;

		// Check access with edit permission required
		const access = await checkProjectAccess(roomId, locals.user?.id, true);
		if ('error' in access) {
			return json({ error: access.error }, { status: access.status });
		}

		const projectData = access.project;

		// Update project content
		await db
			.update(project)
			.set({
				content: content || '',
				updatedAt: new Date()
			})
			.where(eq(project.id, projectData.id));

		return json({ success: true });
	} catch (error) {
		console.error('Error creating/updating project content:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
	const { roomId } = params;

	try {
		const body = await request.json();
		const { content } = body;

		// Check access with edit permission required
		const access = await checkProjectAccess(roomId, locals.user?.id, true);
		if ('error' in access) {
			return json({ error: access.error }, { status: access.status });
		}

		const projectData = access.project;

		// Update project content
		await db
			.update(project)
			.set({
				content: content || '',
				updatedAt: new Date()
			})
			.where(eq(project.id, projectData.id));

		return json({ success: true });
	} catch (error) {
		console.error('Error updating project content:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
