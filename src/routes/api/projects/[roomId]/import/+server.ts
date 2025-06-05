import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project, file } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	try {
		// Check if user is authenticated (similar to other API endpoints)
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const user = locals.user;

		const { roomId } = params;
		if (!roomId) {
			return json({ error: 'Room ID required' }, { status: 400 });
		}

		// Parse multipart form data
		const formData = await request.formData();
		const files = formData.getAll('files') as File[];
		const projectName = formData.get('projectName') as string;

		if (!files || files.length === 0) {
			return json({ error: 'No files provided' }, { status: 400 });
		}

		// Validate file types (only text files for LaTeX projects)
		const allowedExtensions = ['.tex', '.bib', '.cls', '.sty', '.txt', '.md'];
		const invalidFiles = files.filter((file) => {
			const extension = '.' + file.name.split('.').pop()?.toLowerCase();
			return !allowedExtensions.includes(extension);
		});

		if (invalidFiles.length > 0) {
			return json(
				{
					error: `Invalid file types: ${invalidFiles.map((f) => f.name).join(', ')}. Only text-based files are supported.`
				},
				{ status: 400 }
			);
		}

		// Check if project already exists
		const existingProject = await db
			.select()
			.from(project)
			.where(eq(project.roomId, roomId))
			.limit(1);

		let projectId: string;

		if (existingProject.length > 0) {
			// Use existing project
			projectId = existingProject[0].id;

			// Verify user owns the project or has edit access
			if (existingProject[0].ownerId !== user.id) {
				return json({ error: 'Permission denied' }, { status: 403 });
			}
		} else {
			// Create new project
			const newProject = await db
				.insert(project)
				.values({
					id: crypto.randomUUID(),
					roomId,
					name: projectName || 'Imported Project',
					ownerId: user.id,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			projectId = newProject[0].id;
		}

		// Process uploaded files
		const fileRecords: Array<{
			id: string;
			projectId: string;
			name: string;
			path: string;
			type: 'file' | 'folder';
			content: string | null;
			parentId: string | null;
			createdAt: Date;
			updatedAt: Date;
		}> = [];

		for (const uploadedFile of files) {
			// Extract file path from webkitRelativePath or use just the name
			const relativePath = (uploadedFile as any).webkitRelativePath || uploadedFile.name;
			const pathParts = relativePath.split('/');

			// Skip if this is a directory (no content)
			if (uploadedFile.size === 0 && uploadedFile.type === '') {
				continue;
			}

			// Read file content
			const content = await uploadedFile.text();

			// Create file record
			const fileId = crypto.randomUUID();
			const fileName = pathParts[pathParts.length - 1];
			const filePath = '/' + relativePath;

			// Determine parent folder if nested
			let parentId: string | null = null;
			if (pathParts.length > 1) {
				// Create parent folders if they don't exist
				let currentPath = '';
				let currentParentId: string | null = null;

				for (let i = 0; i < pathParts.length - 1; i++) {
					currentPath += (currentPath ? '/' : '') + pathParts[i];
					const folderPath = '/' + currentPath;

					// Check if folder already exists in our records
					let existingFolder = fileRecords.find(
						(f) => f.path === folderPath && f.type === 'folder'
					) as (typeof fileRecords)[0] | undefined;

					if (!existingFolder) {
						// Check database for existing folder
						const dbFolder = await db
							.select()
							.from(file)
							.where(
								and(
									eq(file.projectId, projectId),
									eq(file.path, folderPath),
									eq(file.type, 'folder')
								)
							)
							.limit(1);

						if (dbFolder.length > 0) {
							existingFolder = dbFolder[0];
						} else {
							// Create new folder
							const folderId = crypto.randomUUID();
							const folderRecord: (typeof fileRecords)[0] = {
								id: folderId,
								projectId,
								name: pathParts[i],
								path: folderPath,
								type: 'folder' as const,
								content: null,
								parentId: currentParentId,
								createdAt: new Date(),
								updatedAt: new Date()
							};

							fileRecords.push(folderRecord);
							existingFolder = folderRecord;
						}
					}

					currentParentId = existingFolder.id;
				}

				parentId = currentParentId;
			}

			fileRecords.push({
				id: fileId,
				projectId,
				name: fileName,
				path: filePath,
				type: 'file' as const,
				content,
				parentId,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		// Insert all files in a transaction
		await db.transaction(async (tx) => {
			for (const fileRecord of fileRecords) {
				await tx.insert(file).values(fileRecord);
			}
		});

		return json({
			success: true,
			message: `Successfully imported ${files.length} files`,
			filesImported: files.length,
			projectId
		});
	} catch (error) {
		console.error('Import failed:', error);
		return json(
			{
				error: 'Import failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
