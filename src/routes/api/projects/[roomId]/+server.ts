import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project, file, projectShare } from '$lib/server/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { roomId } = params;

	try {
		// Get project
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		// Check if user has access (owner or shared with)
		let userPermission = 'view'; // default for anonymous users
		let isOwner = false;

		if (locals.user) {
			isOwner = projectData.ownerId === locals.user.id;

			if (isOwner) {
				userPermission = 'edit'; // owners always have edit permission
			} else {
				// Check if project is shared with this user
				const shares = await db
					.select()
					.from(projectShare)
					.where(
						and(
							eq(projectShare.projectId, projectData.id),
							or(
								eq(projectShare.sharedWithUserId, locals.user.id),
								isNull(projectShare.sharedWithUserId) // public share
							)
						)
					);

				if (shares.length === 0) {
					return json({ error: 'Access denied' }, { status: 403 });
				}

				// Find the most permissive access level
				const hasEdit = shares.some(share => share.permission === 'edit');
				userPermission = hasEdit ? 'edit' : 'view';
			}
		} else {
			// Anonymous user - check if project has public sharing
			const publicShares = await db
				.select()
				.from(projectShare)
				.where(
					and(eq(projectShare.projectId, projectData.id), isNull(projectShare.sharedWithUserId))
				);

			if (publicShares.length === 0) {
				return json({ error: 'Unauthorized' }, { status: 401 });
			}

			// For anonymous users, use the most permissive public permission
			const hasEdit = publicShares.some(share => share.permission === 'edit');
			userPermission = hasEdit ? 'edit' : 'view';
		}

		// Get all files for this project
		const files = await db.select().from(file).where(eq(file.projectId, projectData.id));

		return json({
			project: projectData,
			files: files,
			userPermission: userPermission,
			isOwner: isOwner
		});
	} catch (error) {
		console.error('Error fetching project:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const { roomId } = params;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name } = body;

		if (!name) {
			return json({ error: 'Project name is required' }, { status: 400 });
		}

		// Create project
		const projectId = `project-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		const now = new Date();

		await db.insert(project).values({
			id: projectId,
			roomId,
			name,
			content: `\\documentclass{article}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\title{${name}}
\\author{${locals.user.username}}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Start writing your LaTeX document here...

\\end{document}`,
			ownerId: locals.user.id,
			createdAt: now,
			updatedAt: now
		});

		return json({
			project: {
				id: projectId,
				roomId,
				name,
				ownerId: locals.user.id,
				createdAt: now,
				updatedAt: now
			},
			content: `\\documentclass{article}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\title{${name}}
\\author{${locals.user.username}}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Start writing your LaTeX document here...

\\end{document}`
		});
	} catch (error) {
		console.error('Error creating project:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { roomId } = params;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get project to verify ownership
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		// Check if user owns the project
		if (projectData.ownerId !== locals.user.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Delete all related records in a transaction
		await db.transaction(async (tx) => {
			// 1. Delete all files for this project
			await tx.delete(file).where(eq(file.projectId, projectData.id));

			// 2. Delete all shares for this project
			await tx.delete(projectShare).where(eq(projectShare.projectId, projectData.id));

			// 3. Delete the project
			await tx.delete(project).where(eq(project.id, projectData.id));
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting project:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
