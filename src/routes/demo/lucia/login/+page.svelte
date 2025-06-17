<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';

	let { form }: { form: ActionData } = $props();
	let isRegistering = $state(false);
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 p-4"
>
	<div class="w-full max-w-md">
		<div class="rounded-lg bg-white/80 backdrop-blur-sm border border-teal-200 p-8 shadow-xl">
			<div class="mb-8 text-center">
				<img src="/collabtex-logo.png" alt="CollabTex" class="mx-auto mb-4 h-16 w-auto rounded-lg shadow-md" />
				<h1 class="text-gray-800 text-2xl font-bold">
					{isRegistering ? 'Create Account' : 'Welcome Back'}
				</h1>
				<p class="text-gray-600 mt-2 text-sm">
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
					<label for="username" class="text-gray-700 mb-1 block text-sm font-medium">
						Username
					</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						class="w-full rounded border border-teal-200 px-3 py-2 text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 focus:outline-none"
						placeholder="Enter your username"
					/>
				</div>

				<div>
					<label for="password" class="text-gray-700 mb-1 block text-sm font-medium">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="w-full rounded border border-teal-200 px-3 py-2 text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 focus:outline-none"
						placeholder="Enter your password"
					/>
				</div>

				{#if form?.message}
					<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
						{form.message}
					</div>
				{/if}

				<div class="space-y-3">
					<Button type="submit" variant="default" class="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-md">
						{isRegistering ? 'Create Account' : 'Sign In'}
					</Button>

					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-teal-200"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="bg-white/80 text-gray-500 px-2">or</span>
						</div>
					</div>

					<button
						type="button"
						onclick={() => (isRegistering = !isRegistering)}
						class="w-full text-center text-sm text-teal-600 hover:text-teal-700 transition-colors"
					>
						{isRegistering
							? 'Already have an account? Sign in'
							: "Don't have an account? Create one"}
					</button>
				</div>
			</form>
		</div>

		<p class="text-gray-500 mt-8 text-center text-xs">
			By signing in, you agree to our Terms of Service and Privacy Policy
		</p>
	</div>
</div>
