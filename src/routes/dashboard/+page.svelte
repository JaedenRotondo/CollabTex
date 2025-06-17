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

<div class="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
	<div class="container mx-auto px-4 py-8">
		<div class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<img src="/collabtex-logo.png" alt="CollabTex" class="h-12 w-12 rounded-lg shadow-md" />
				<div>
					<h1 class="mb-2 text-3xl font-bold text-gray-800">My Projects</h1>
					<p class="text-gray-600">Welcome back, {data.user.username}!</p>
				</div>
			</div>
			<form method="post" action="/demo/lucia?/logout">
				<Button type="submit" variant="outline" class="border-teal-300 text-teal-700 hover:bg-teal-50">Logout</Button>
			</form>
		</div>

		{#if error}
			<div class="mb-4 rounded-md bg-red-50 p-4 text-red-700 border border-red-200">
				{error}
			</div>
		{/if}

		<div class="mb-6 rounded-lg bg-white/70 backdrop-blur-sm p-6 shadow-sm border border-teal-100">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">Create New Project</h2>
			<form on:submit|preventDefault={createProject} class="flex gap-4">
				<input
					type="text"
					bind:value={newProjectName}
					placeholder="Project name"
					class="flex-1 rounded-md border border-teal-200 px-4 py-2 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-colors"
					disabled={creatingProject}
				/>
				<Button type="submit" disabled={creatingProject || !newProjectName.trim()} class="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-md">
					{creatingProject ? 'Creating...' : 'Create Project'}
				</Button>
			</form>
		</div>

		<div class="rounded-lg bg-white/70 backdrop-blur-sm p-6 shadow-sm border border-teal-100">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-800">Your Projects</h2>

				<div class="flex rounded-md border">
					<button
						class="rounded-l-md px-4 py-2 text-sm font-medium transition-colors {filterView ===
						'all'
							? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
							: 'bg-white/50 text-gray-700 hover:bg-teal-50 border border-teal-200'}"
						on:click={() => (filterView = 'all')}
					>
						All ({projects.length})
					</button>
					<button
						class="border-x border-teal-200 px-4 py-2 text-sm font-medium transition-colors {filterView === 'owned'
							? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
							: 'bg-white/50 text-gray-700 hover:bg-teal-50'}"
						on:click={() => (filterView = 'owned')}
					>
						Owned ({ownedCount})
					</button>
					<button
						class="rounded-r-md px-4 py-2 text-sm font-medium transition-colors border border-teal-200 {filterView ===
						'shared'
							? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
							: 'bg-white/50 text-gray-700 hover:bg-teal-50'}"
						on:click={() => (filterView = 'shared')}
					>
						Shared ({sharedCount})
					</button>
				</div>
			</div>

			{#if loading}
				<p class="text-gray-600">Loading projects...</p>
			{:else if filteredProjects.length === 0}
				{#if filterView === 'owned'}
					<p class="text-gray-600">
						No owned projects yet. Create your first project above!
					</p>
				{:else if filterView === 'shared'}
					<p class="text-gray-600">
						No shared projects yet. Projects shared with you will appear here.
					</p>
				{:else}
					<p class="text-gray-600">No projects yet. Create your first project above!</p>
				{/if}
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredProjects as project}
						<div class="rounded-lg border border-teal-100 bg-white/60 backdrop-blur-sm p-4 transition-all hover:shadow-md hover:bg-white/80">
							<div class="mb-2 flex items-center justify-between">
								<h3 class="text-lg font-semibold text-gray-800">{project.name}</h3>
								{#if project.isOwner}
									<span
										class="bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 rounded-full px-2 py-1 text-xs font-medium"
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
								<p class="text-gray-600 mb-2 text-xs">
									Shared by: {project.sharedBy}
								</p>
							{/if}

							<p class="text-gray-600 mb-3 text-sm">
								Updated: {formatDate(project.updatedAt)}
							</p>

							<div class="flex gap-2">
								<Button
									variant="default"
									size="sm"
									on:click={() => goto(`/editor/${project.roomId}`)}
									class="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-sm"
								>
									Open
								</Button>
								{#if project.isOwner}
									<Button variant="outline" size="sm" on:click={() => openShareModal(project)} class="border-teal-300 text-teal-700 hover:bg-teal-50">
										Share
									</Button>
									<Button
										variant="outline"
										size="sm"
										on:click={() => deleteProject(project.id, project.roomId)}
										class="border-red-300 text-red-700 hover:bg-red-50"
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
