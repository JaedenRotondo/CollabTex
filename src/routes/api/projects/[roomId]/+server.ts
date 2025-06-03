import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project, file } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { roomId } = params;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get project
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		// Get all files for this project
		const files = await db.select().from(file).where(eq(file.projectId, projectData.id));

		return json({
			project: projectData,
			files: files
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
			ownerId: locals.user.id,
			createdAt: now,
			updatedAt: now
		});

		// Create default main.tex file
		const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		await db.insert(file).values({
			id: fileId,
			projectId: projectId,
			name: 'main.tex',
			path: '/main.tex',
			type: 'file',
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
			parentId: null,
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
			files: [
				{
					id: fileId,
					projectId: projectId,
					name: 'main.tex',
					path: '/main.tex',
					type: 'file',
					parentId: null
				}
			]
		});
	} catch (error) {
		console.error('Error creating project:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
