import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const project = sqliteTable('project', {
	id: text('id').primaryKey(),
	roomId: text('room_id').notNull().unique(),
	name: text('name').notNull(),
	ownerId: text('owner_id')
		.notNull()
		.references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const file = sqliteTable('file', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id),
	name: text('name').notNull(),
	path: text('path').notNull(),
	type: text('type', { enum: ['file', 'folder'] }).notNull(),
	content: text('content'),
	parentId: text('parent_id'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const projectShare = sqliteTable('project_share', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id),
	sharedWithUserId: text('shared_with_user_id').references(() => user.id), // null means public/anonymous access
	permission: text('permission', { enum: ['view', 'edit'] }).notNull(),
	sharedBy: text('shared_by')
		.notNull()
		.references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Project = typeof project.$inferSelect;
export type File = typeof file.$inferSelect;
export type ProjectShare = typeof projectShare.$inferSelect;
