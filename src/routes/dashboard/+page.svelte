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
		createdAt: string;
		updatedAt: string;
	}

	let projects: Project[] = [];
	let loading = true;
	let error = '';
	let creatingProject = false;
	let newProjectName = '';
	let shareModalOpen = false;
	let shareProject: Project | null = null;

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

			projects = projects.filter(p => p.id !== projectId);
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
</script>

<div class="min-h-screen bg-background">
	<div class="container mx-auto px-4 py-8">
		<div class="flex justify-between items-center mb-8">
			<div>
				<h1 class="text-3xl font-bold mb-2">My Projects</h1>
				<p class="text-muted-foreground">Welcome back, {data.user.username}!</p>
			</div>
			<form method="post" action="/demo/lucia?/logout">
				<Button type="submit" variant="outline">Logout</Button>
			</form>
		</div>

		{#if error}
			<div class="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
				{error}
			</div>
		{/if}

		<div class="bg-card rounded-lg p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">Create New Project</h2>
			<form on:submit|preventDefault={createProject} class="flex gap-4">
				<input
					type="text"
					bind:value={newProjectName}
					placeholder="Project name"
					class="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
					disabled={creatingProject}
				/>
				<Button type="submit" disabled={creatingProject || !newProjectName.trim()}>
					{creatingProject ? 'Creating...' : 'Create Project'}
				</Button>
			</form>
		</div>

		<div class="bg-card rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Your Projects</h2>
			
			{#if loading}
				<p class="text-muted-foreground">Loading projects...</p>
			{:else if projects.length === 0}
				<p class="text-muted-foreground">No projects yet. Create your first project above!</p>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each projects as project}
						<div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
							<h3 class="font-semibold text-lg mb-2">{project.name}</h3>
							<p class="text-sm text-muted-foreground mb-3">
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
								<Button
									variant="outline"
									size="sm"
									on:click={() => openShareModal(project)}
								>
									Share
								</Button>
								<Button
									variant="outline"
									size="sm"
									on:click={() => deleteProject(project.id, project.roomId)}
								>
									Delete
								</Button>
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