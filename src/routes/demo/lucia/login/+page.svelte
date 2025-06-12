<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';

	let { form }: { form: ActionData } = $props();
	let isRegistering = $state(false);
</script>

<div
	class="from-academic-gray-50 to-academic-gray-100 flex min-h-screen items-center justify-center bg-gradient-to-b p-4"
>
	<div class="w-full max-w-md">
		<div class="bg-academic-paper border-academic-border rounded-lg border p-8 shadow-xl">
			<div class="mb-8 text-center">
				<img src="/collabtex-logo.png" alt="CollabTex" class="mx-auto mb-4 h-12 w-auto" />
				<h1 class="text-academic-gray-900 text-2xl font-bold">
					{isRegistering ? 'Create Account' : 'Welcome Back'}
				</h1>
				<p class="text-academic-gray-600 mt-2 text-sm">
					{isRegistering
						? 'Join CollabTex for collaborative LaTeX editing'
						: 'Sign in to continue to your projects'}
				</p>
			</div>

			<form
				method="post"
				action={isRegistering ? '?/register' : '?/login'}
				use:enhance
				class="space-y-6"
			>
				<div>
					<label for="username" class="text-academic-gray-700 mb-1 block text-sm font-medium">
						Username
					</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						class="border-academic-gray-300 text-academic-gray-900 placeholder-academic-gray-400 focus:ring-academic-primary focus:border-academic-primary w-full rounded border px-3 py-2 transition-colors duration-200 focus:ring-2 focus:outline-none"
						placeholder="Enter your username"
					/>
				</div>

				<div>
					<label for="password" class="text-academic-gray-700 mb-1 block text-sm font-medium">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="border-academic-gray-300 text-academic-gray-900 placeholder-academic-gray-400 focus:ring-academic-primary focus:border-academic-primary w-full rounded border px-3 py-2 transition-colors duration-200 focus:ring-2 focus:outline-none"
						placeholder="Enter your password"
					/>
				</div>

				{#if form?.message}
					<div class="text-academic-error rounded border border-red-200 bg-red-50 p-3 text-sm">
						{form.message}
					</div>
				{/if}

				<div class="space-y-3">
					<Button type="submit" variant="default" class="w-full">
						{isRegistering ? 'Create Account' : 'Sign In'}
					</Button>

					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="border-academic-gray-200 w-full border-t"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="bg-academic-paper text-academic-gray-500 px-2">or</span>
						</div>
					</div>

					<button
						type="button"
						onclick={() => (isRegistering = !isRegistering)}
						class="text-academic-primary hover:text-academic-primary/80 w-full text-center text-sm transition-colors"
					>
						{isRegistering
							? 'Already have an account? Sign in'
							: "Don't have an account? Create one"}
					</button>
				</div>
			</form>
		</div>

		<p class="text-academic-gray-500 mt-8 text-center text-xs">
			By signing in, you agree to our Terms of Service and Privacy Policy
		</p>
	</div>
</div>
