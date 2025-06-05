import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project, projectShare, user } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const { roomId } = params;

	console.log('Share POST request:', { roomId, userId: locals.user?.id });

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { username, permission } = body;

		// Validate permission
		if (permission !== 'view' && permission !== 'edit') {
			return json({ error: 'Invalid permission. Must be "view" or "edit"' }, { status: 400 });
		}

		// Get project and verify ownership
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		if (projectData.ownerId !== locals.user.id) {
			return json({ error: 'Only project owners can share projects' }, { status: 403 });
		}

		// If username is provided, find the user
		let sharedWithUserId = null;
		if (username) {
			const users = await db.select().from(user).where(eq(user.username, username));
			if (users.length === 0) {
				return json({ error: 'User not found' }, { status: 404 });
			}
			sharedWithUserId = users[0].id;

			// Don't allow sharing with yourself
			if (sharedWithUserId === locals.user.id) {
				return json({ error: 'Cannot share project with yourself' }, { status: 400 });
			}

			// Check if already shared with this user
			const existingShares = await db
				.select()
				.from(projectShare)
				.where(
					and(
						eq(projectShare.projectId, projectData.id),
						eq(projectShare.sharedWithUserId, sharedWithUserId)
					)
				);

			if (existingShares.length > 0) {
				// Update existing share
				await db
					.update(projectShare)
					.set({ permission })
					.where(eq(projectShare.id, existingShares[0].id));

				return json({ message: 'Share updated successfully' });
			}
		}

		// Create new share
		const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		await db.insert(projectShare).values({
			id: shareId,
			projectId: projectData.id,
			sharedWithUserId: sharedWithUserId || null,
			permission,
			sharedBy: locals.user.id,
			createdAt: new Date()
		});

		return json({
			message: username ? 'Project shared successfully' : 'Public link created',
			shareId
		});
	} catch (error) {
		console.error('Error sharing project:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async ({ params, locals }) => {
	const { roomId } = params;

	console.log('Share GET request:', { roomId, userId: locals.user?.id });

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get project and verify ownership
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		if (projectData.ownerId !== locals.user.id) {
			return json({ error: 'Only project owners can view shares' }, { status: 403 });
		}

		// Get all shares for this project
		const shares = await db
			.select({
				id: projectShare.id,
				username: user.username,
				permission: projectShare.permission,
				createdAt: projectShare.createdAt,
				isPublic: projectShare.sharedWithUserId
			})
			.from(projectShare)
			.leftJoin(user, eq(projectShare.sharedWithUserId, user.id))
			.where(eq(projectShare.projectId, projectData.id));

		return json({
			shares: shares.map((share) => ({
				id: share.id,
				username: share.username,
				permission: share.permission,
				createdAt: share.createdAt,
				isPublic: share.isPublic === null
			}))
		});
	} catch (error) {
		console.error('Error fetching shares:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params, locals, request }) => {
	const { roomId } = params;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { shareId } = body;

		if (!shareId) {
			return json({ error: 'Share ID is required' }, { status: 400 });
		}

		// Get project and verify ownership
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		if (projectData.ownerId !== locals.user.id) {
			return json({ error: 'Only project owners can remove shares' }, { status: 403 });
		}

		// Delete the share
		await db
			.delete(projectShare)
			.where(and(eq(projectShare.id, shareId), eq(projectShare.projectId, projectData.id)));

		return json({ message: 'Share removed successfully' });
	} catch (error) {
		console.error('Error removing share:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
