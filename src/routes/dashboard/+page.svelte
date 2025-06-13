<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import Button from '$lib/components/ui/button/button.svelte';
	import ShareModal from '$lib/components/ShareModal.svelte';

	export let data: PageData;

	interface Project {
		id: string;
		roomId: string;
		name: string;
		ownerId: string;
		createdAt: string;
		updatedAt: string;
		isOwner: boolean;
		permission: 'view' | 'edit';
		sharedBy?: string | null;
	}

	let projects: Project[] = [];
	let loading = true;
	let error = '';
	let creatingProject = false;
	let newProjectName = '';
	let shareModalOpen = false;
	let shareProject: Project | null = null;
	let filterView: 'all' | 'owned' | 'shared' = 'all';

	onMount(async () => {
		await fetchProjects();
	});

	async function fetchProjects() {
		try {
			const response = await fetch('/api/projects');
			if (!response.ok) {
				throw new Error('Failed to fetch projects');
			}
			const data = await response.json();
			projects = data.projects;
		} catch (err) {
			error = 'Failed to load projects';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function createProject() {
		if (!newProjectName.trim()) return;

		creatingProject = true;
		const roomId = crypto.randomUUID();

		try {
			const response = await fetch(`/api/projects/${roomId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: newProjectName })
			});

			if (!response.ok) {
				throw new Error('Failed to create project');
			}

			goto(`/editor/${roomId}`);
		} catch (err) {
			error = 'Failed to create project';
			console.error(err);
		} finally {
			creatingProject = false;
		}
	}

	async function deleteProject(projectId: string, roomId: string) {
		if (!confirm('Are you sure you want to delete this project?')) return;

		try {
			const response = await fetch(`/api/projects/${roomId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete project');
			}

			projects = projects.filter((p) => p.id !== projectId);
		} catch (err) {
			error = 'Failed to delete project';
			console.error(err);
		}
	}

	function openShareModal(project: Project) {
		shareProject = project;
		shareModalOpen = true;
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	$: filteredProjects = projects.filter((project) => {
		if (filterView === 'owned') return project.isOwner;
		if (filterView === 'shared') return !project.isOwner;
		return true; // 'all'
	});

	$: ownedCount = projects.filter((p) => p.isOwner).length;
	$: sharedCount = projects.filter((p) => !p.isOwner).length;
</script>

<div class="bg-background min-h-screen">
	<div class="container mx-auto px-4 py-8">
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="mb-2 text-3xl font-bold">My Projects</h1>
				<p class="text-muted-foreground">Welcome back, {data.user.username}!</p>
			</div>
			<form method="post" action="/demo/lucia?/logout">
				<Button type="submit" variant="outline">Logout</Button>
			</form>
		</div>

		{#if error}
			<div class="bg-destructive/10 text-destructive mb-4 rounded-md p-4">
				{error}
			</div>
		{/if}

		<div class="bg-card mb-6 rounded-lg p-6">
			<h2 class="mb-4 text-xl font-semibold">Create New Project</h2>
			<form on:submit|preventDefault={createProject} class="flex gap-4">
				<input
					type="text"
					bind:value={newProjectName}
					placeholder="Project name"
					class="focus:ring-primary flex-1 rounded-md border px-4 py-2 focus:ring-2 focus:outline-none"
					disabled={creatingProject}
				/>
				<Button type="submit" disabled={creatingProject || !newProjectName.trim()}>
					{creatingProject ? 'Creating...' : 'Create Project'}
				</Button>
			</form>
		</div>

		<div class="bg-card rounded-lg p-6">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-semibold">Your Projects</h2>

				<div class="flex rounded-md border">
					<button
						class="rounded-l-md px-4 py-2 text-sm font-medium transition-colors {filterView ===
						'all'
							? 'bg-primary text-primary-foreground'
							: 'bg-background hover:bg-muted'}"
						on:click={() => (filterView = 'all')}
					>
						All ({projects.length})
					</button>
					<button
						class="border-x px-4 py-2 text-sm font-medium transition-colors {filterView === 'owned'
							? 'bg-primary text-primary-foreground'
							: 'bg-background hover:bg-muted'}"
						on:click={() => (filterView = 'owned')}
					>
						Owned ({ownedCount})
					</button>
					<button
						class="rounded-r-md px-4 py-2 text-sm font-medium transition-colors {filterView ===
						'shared'
							? 'bg-primary text-primary-foreground'
							: 'bg-background hover:bg-muted'}"
						on:click={() => (filterView = 'shared')}
					>
						Shared ({sharedCount})
					</button>
				</div>
			</div>

			{#if loading}
				<p class="text-muted-foreground">Loading projects...</p>
			{:else if filteredProjects.length === 0}
				{#if filterView === 'owned'}
					<p class="text-muted-foreground">
						No owned projects yet. Create your first project above!
					</p>
				{:else if filterView === 'shared'}
					<p class="text-muted-foreground">
						No shared projects yet. Projects shared with you will appear here.
					</p>
				{:else}
					<p class="text-muted-foreground">No projects yet. Create your first project above!</p>
				{/if}
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredProjects as project}
						<div class="rounded-lg border p-4 transition-shadow hover:shadow-md">
							<div class="mb-2 flex items-center justify-between">
								<h3 class="text-lg font-semibold">{project.name}</h3>
								{#if project.isOwner}
									<span
										class="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium"
									>
										Owner
									</span>
								{:else}
									<span
										class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
									>
										{project.permission}
									</span>
								{/if}
							</div>

							{#if !project.isOwner && project.sharedBy}
								<p class="text-muted-foreground mb-2 text-xs">
									Shared by: {project.sharedBy}
								</p>
							{/if}

							<p class="text-muted-foreground mb-3 text-sm">
								Updated: {formatDate(project.updatedAt)}
							</p>

							<div class="flex gap-2">
								<Button
									variant="default"
									size="sm"
									on:click={() => goto(`/editor/${project.roomId}`)}
								>
									Open
								</Button>
								{#if project.isOwner}
									<Button variant="outline" size="sm" on:click={() => openShareModal(project)}>
										Share
									</Button>
									<Button
										variant="outline"
										size="sm"
										on:click={() => deleteProject(project.id, project.roomId)}
									>
										Delete
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

{#if shareProject}
	<ShareModal
		bind:isOpen={shareModalOpen}
		projectName={shareProject.name}
		roomId={shareProject.roomId}
		on:close={() => {
			shareModalOpen = false;
			shareProject = null;
		}}
	/>
{/if}
