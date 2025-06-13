import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project, projectShare, user } from '$lib/server/db/schema';
import { eq, desc, or, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get owned projects
		const ownedProjects = await db
			.select({
				id: project.id,
				roomId: project.roomId,
				name: project.name,
				ownerId: project.ownerId,
				createdAt: project.createdAt,
				updatedAt: project.updatedAt
			})
			.from(project)
			.where(eq(project.ownerId, locals.user.id));

		// Get shared projects
		const sharedProjects = await db
			.select({
				id: project.id,
				roomId: project.roomId,
				name: project.name,
				ownerId: project.ownerId,
				createdAt: project.createdAt,
				updatedAt: project.updatedAt,
				permission: projectShare.permission,
				sharedBy: user.username
			})
			.from(projectShare)
			.innerJoin(project, eq(projectShare.projectId, project.id))
			.innerJoin(user, eq(projectShare.sharedBy, user.id))
			.where(eq(projectShare.sharedWithUserId, locals.user.id));

		// Transform and combine projects
		const transformedOwnedProjects = ownedProjects.map((p) => ({
			...p,
			isOwner: true,
			permission: 'edit' as const,
			sharedBy: null
		}));

		const transformedSharedProjects = sharedProjects.map((p) => ({
			...p,
			isOwner: false,
			permission: p.permission,
			sharedBy: p.sharedBy
		}));

		// Combine and sort by updatedAt
		const allProjects = [...transformedOwnedProjects, ...transformedSharedProjects].sort(
			(a, b) => new Date(b.updatedAt as Date).getTime() - new Date(a.updatedAt as Date).getTime()
		);

		return json({ projects: allProjects });
	} catch (error) {
		console.error('Error fetching projects:', error);
		return json({ error: 'Failed to fetch projects' }, { status: 500 });
	}
};
