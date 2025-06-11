<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';

	let { form }: { form: ActionData } = $props();
	let isRegistering = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-academic-gray-50 to-academic-gray-100 p-4">
	<div class="w-full max-w-md">
		<div class="bg-academic-paper border border-academic-border rounded-lg p-8 shadow-xl">
			<div class="mb-8 text-center">
				<img src="/collabtex-logo.png" alt="CollabTex" class="h-12 w-auto mx-auto mb-4" />
				<h1 class="text-2xl font-bold text-academic-gray-900">
					{isRegistering ? 'Create Account' : 'Welcome Back'}
				</h1>
				<p class="mt-2 text-sm text-academic-gray-600">
					{isRegistering 
						? 'Join CollabTex for collaborative LaTeX editing' 
						: 'Sign in to continue to your projects'}
				</p>
			</div>

			<form method="post" action={isRegistering ? "?/register" : "?/login"} use:enhance class="space-y-6">
				<div>
					<label for="username" class="block text-sm font-medium text-academic-gray-700 mb-1">
						Username
					</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						class="w-full rounded border border-academic-gray-300 px-3 py-2 text-academic-gray-900 placeholder-academic-gray-400 focus:ring-2 focus:ring-academic-primary focus:border-academic-primary focus:outline-none transition-colors duration-200"
						placeholder="Enter your username"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-academic-gray-700 mb-1">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="w-full rounded border border-academic-gray-300 px-3 py-2 text-academic-gray-900 placeholder-academic-gray-400 focus:ring-2 focus:ring-academic-primary focus:border-academic-primary focus:outline-none transition-colors duration-200"
						placeholder="Enter your password"
					/>
				</div>

				{#if form?.message}
					<div class="rounded bg-red-50 border border-red-200 p-3 text-sm text-academic-error">
						{form.message}
					</div>
				{/if}

				<div class="space-y-3">
					<Button type="submit" variant="default" class="w-full">
						{isRegistering ? 'Create Account' : 'Sign In'}
					</Button>

					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-academic-gray-200"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="bg-academic-paper px-2 text-academic-gray-500">or</span>
						</div>
					</div>

					<button
						type="button"
						onclick={() => isRegistering = !isRegistering}
						class="w-full text-center text-sm text-academic-primary hover:text-academic-primary/80 transition-colors"
					>
						{isRegistering 
							? 'Already have an account? Sign in' 
							: "Don't have an account? Create one"}
					</button>
				</div>
			</form>
		</div>

		<p class="mt-8 text-center text-xs text-academic-gray-500">
			By signing in, you agree to our Terms of Service and Privacy Policy
		</p>
	</div>
</div>