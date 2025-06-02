<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	let roomId = '';

	function createNewRoom() {
		const newRoomId = generateRoomId();
		goto(`/editor/${newRoomId}`);
	}

	function joinRoom() {
		if (roomId.trim()) {
			goto(`/editor/${roomId.trim()}`);
		}
	}

	function generateRoomId(): string {
		return (
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		);
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4"
>
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-4xl font-bold text-gray-900">CollabTeX</h1>
			<p class="text-lg text-gray-600">Collaborative LaTeX editing in your browser</p>
		</div>

		<div class="space-y-6 rounded-lg bg-white p-6 shadow-lg">
			<div>
				<h2 class="mb-4 text-xl font-semibold">Start a new document</h2>
				<Button
					on:click={createNewRoom}
					size="lg"
					class="bg-overleaf-green hover:bg-overleaf-green/90 w-full"
				>
					Create New Room
				</Button>
			</div>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-white px-2 text-gray-500">Or</span>
				</div>
			</div>

			<div>
				<h2 class="mb-4 text-xl font-semibold">Join existing room</h2>
				<form on:submit|preventDefault={joinRoom} class="space-y-4">
					<input
						type="text"
						bind:value={roomId}
						placeholder="Enter room ID"
						class="focus:ring-overleaf-green w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2"
					/>
					<Button
						type="submit"
						size="lg"
						variant="outline"
						class="w-full"
						disabled={!roomId.trim()}
					>
						Join Room
					</Button>
				</form>
			</div>
		</div>

		<div class="mt-8 text-center text-sm text-gray-600">
			<p>Powered by YJS for real-time collaboration</p>
			<p class="mt-2">LaTeX compilation happens entirely in your browser</p>
		</div>
	</div>
</div>
