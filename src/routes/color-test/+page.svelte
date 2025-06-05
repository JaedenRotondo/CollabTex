<script>
	// Test component to verify academic colors are working
</script>

<div class="p-8 space-y-4">
	<h1 class="text-2xl font-bold text-academic-gray-900">Academic Colors Test</h1>
	
	<div class="grid grid-cols-3 gap-4">
		<!-- Primary Colors -->
		<div class="bg-academic-primary p-4 rounded text-white">
			Primary: bg-academic-primary
		</div>
		<div class="bg-academic-primary-dark p-4 rounded text-white">
			Primary Dark: bg-academic-primary-dark
		</div>
		<div class="bg-academic-primary-light p-4 rounded text-academic-gray-900">
			Primary Light: bg-academic-primary-light
		</div>
		
		<!-- Gray Colors -->
		<div class="bg-academic-gray-100 p-4 rounded text-academic-gray-900">
			Gray 100: bg-academic-gray-100
		</div>
		<div class="bg-academic-gray-300 p-4 rounded text-academic-gray-900">
			Gray 300: bg-academic-gray-300
		</div>
		<div class="bg-academic-gray-600 p-4 rounded text-white">
			Gray 600: bg-academic-gray-600
		</div>
		
		<!-- Status Colors -->
		<div class="bg-academic-success p-4 rounded text-white">
			Success: bg-academic-success
		</div>
		<div class="bg-academic-warning p-4 rounded text-white">
			Warning: bg-academic-warning
		</div>
		<div class="bg-academic-error p-4 rounded text-white">
			Error: bg-academic-error
		</div>
		
		<!-- Special Colors -->
		<div class="bg-academic-paper p-4 rounded border border-academic-border text-academic-gray-900">
			Paper: bg-academic-paper
		</div>
		<div class="bg-academic-sidebar p-4 rounded text-academic-gray-900">
			Sidebar: bg-academic-sidebar
		</div>
		<div class="bg-academic-toolbar p-4 rounded text-academic-gray-900">
			Toolbar: bg-academic-toolbar
		</div>
	</div>
	
	<!-- Test Buttons -->
	<div class="space-x-4">
		<button class="bg-academic-primary hover:bg-academic-primary-dark text-white px-4 py-2 rounded transition-colors duration-200">
			Primary Button
		</button>
		<button class="border border-academic-gray-300 bg-academic-paper hover:bg-academic-gray-50 text-academic-gray-700 hover:text-academic-gray-900 px-4 py-2 rounded transition-colors duration-200">
			Outline Button
		</button>
	</div>
	
	<!-- Test Text Colors -->
	<div class="space-y-2">
		<p class="text-academic-gray-900">Primary text (academic-gray-900)</p>
		<p class="text-academic-gray-600">Secondary text (academic-gray-600)</p>
		<p class="text-academic-gray-400">Muted text (academic-gray-400)</p>
		<p class="text-academic-primary">Primary colored text (academic-primary)</p>
		<p class="text-academic-error">Error text (academic-error)</p>
	</div>
</div>