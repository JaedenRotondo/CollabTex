import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project, file } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const { roomId } = params;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, type, parentId, content } = body;

		if (!name || !type) {
			return json({ error: 'Name and type are required' }, { status: 400 });
		}

		// Get project
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		// Check if user is owner
		if (projectData.ownerId !== locals.user.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Create file
		const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		const now = new Date();

		// Generate path
		let path = `/${name}`;
		if (parentId) {
			const parentFiles = await db.select().from(file).where(eq(file.id, parentId));
			if (parentFiles.length > 0) {
				path = `${parentFiles[0].path}/${name}`;
			}
		}

		await db.insert(file).values({
			id: fileId,
			projectId: projectData.id,
			name,
			path,
			type,
			content: type === 'file' ? content || '' : null,
			parentId: parentId || null,
			createdAt: now,
			updatedAt: now
		});

		return json({
			id: fileId,
			projectId: projectData.id,
			name,
			path,
			type,
			parentId: parentId || null,
			createdAt: now,
			updatedAt: now
		});
	} catch (error) {
		console.error('Error creating file:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
	const { roomId } = params;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { fileId, updates } = body;

		if (!fileId) {
			return json({ error: 'File ID is required' }, { status: 400 });
		}

		// Get project
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		// Check if user is owner
		if (projectData.ownerId !== locals.user.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Update file
		const updateData: Record<string, unknown> = {
			updatedAt: new Date()
		};

		if (updates.name !== undefined) updateData.name = updates.name;
		if (updates.content !== undefined) updateData.content = updates.content;
		if (updates.parentId !== undefined) updateData.parentId = updates.parentId;

		await db.update(file).set(updateData).where(eq(file.id, fileId));

		return json({ success: true });
	} catch (error) {
		console.error('Error updating file:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, request }) => {
	const { roomId } = params;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { fileId } = body;

		if (!fileId) {
			return json({ error: 'File ID is required' }, { status: 400 });
		}

		// Get project
		const projects = await db.select().from(project).where(eq(project.roomId, roomId));

		if (projects.length === 0) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		const projectData = projects[0];

		// Check if user is owner
		if (projectData.ownerId !== locals.user.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Delete file and all its children recursively
		const deleteRecursive = async (id: string) => {
			// Find all children
			const children = await db.select().from(file).where(eq(file.parentId, id));

			// Delete children first
			for (const child of children) {
				await deleteRecursive(child.id);
			}

			// Delete the file itself
			await db.delete(file).where(eq(file.id, id));
		};

		await deleteRecursive(fileId);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting file:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
