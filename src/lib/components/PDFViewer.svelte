<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface PDFPageProxy {
		getViewport(params: { scale: number }): { width: number; height: number };
		render(params: {
			canvasContext: CanvasRenderingContext2D;
			viewport: { width: number; height: number };
			transform?: number[];
		}): { promise: Promise<void> };
		getTextContent(): Promise<{
			items: Array<{ str?: string; transform?: number[] } | { type?: string; id?: string }>;
		}>;
	}

	interface PDFDocumentProxy {
		numPages: number;
		getPage(pageNumber: number): Promise<PDFPageProxy>;
		destroy(): Promise<void>;
	}

	export let pdfData: ArrayBuffer | null = null;

	let canvas: HTMLCanvasElement;
	let textLayer: HTMLDivElement;
	let pdfDoc: PDFDocumentProxy | null = null;
	let pageNum = 1;
	let pageRendering = false;
	let pageNumPending: number | null = null;
	let scale = 1.5;
	let numPages = 0;
	let pdfjsLib: typeof import('pdfjs-dist') | undefined;
	let dpiScale = 4; // Always use maximum quality (4x) rendering
	let currentPdfData: ArrayBuffer | null = null; // Track current PDF to detect changes

	// Load PDF.js only on client side
	onMount(async () => {
		if (browser) {
			pdfjsLib = await import('pdfjs-dist');
			// Configure PDF.js worker - use local copy to avoid CORS
			pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

			// If pdfData is already available, load it
			if (pdfData) {
				loadPdf(pdfData);
			}
		}
	});

	async function loadPdf(data: ArrayBuffer) {
		if (!pdfjsLib) return;

		try {
			// Destroy existing PDF document if any
			if (pdfDoc) {
				await pdfDoc.destroy();
			}

			currentPdfData = data;
			const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
			const doc = await loadingTask.promise;
			if (doc) {
				pdfDoc = doc;
				numPages = doc.numPages;
				pageNum = 1;
			} else {
				throw new Error('Failed to load PDF document');
			}

			// Initial render
			await renderPage(pageNum);
		} catch (error) {
			console.error('Error loading PDF:', error);
		}
	}

	async function renderPage(num: number) {
		if (!pdfDoc || !pdfjsLib) return;

		pageRendering = true;

		try {
			const page = await pdfDoc.getPage(num);

			// Get device pixel ratio for high DPI displays and apply additional DPI scaling
			const outputScale = (window.devicePixelRatio || 1) * dpiScale;

			const viewport = page.getViewport({ scale: scale * outputScale });

			// Set canvas dimensions
			const context = canvas.getContext('2d');
			if (!context) return;

			// Clear the canvas before rendering
			canvas.height = viewport.height;
			canvas.width = viewport.width;
			context.clearRect(0, 0, canvas.width, canvas.height);

			// Set CSS size to maintain proper display size
			canvas.style.width = Math.floor(viewport.width / outputScale) + 'px';
			canvas.style.height = Math.floor(viewport.height / outputScale) + 'px';

			// Render PDF page
			const renderContext = {
				canvasContext: context,
				viewport: viewport
			};

			await (page as PDFPageProxy).render(renderContext as Parameters<PDFPageProxy['render']>[0])
				.promise;

			// Render text layer for selection
			// For now, we'll skip text layer rendering to avoid direct DOM manipulation
			// In production, you'd use a proper PDF.js text layer renderer

			pageRendering = false;

			if (pageNumPending !== null) {
				renderPage(pageNumPending);
				pageNumPending = null;
			}
		} catch (error) {
			console.error('Error rendering page:', error);
			pageRendering = false;
		}
	}

	function queueRenderPage(num: number) {
		if (pageRendering) {
			pageNumPending = num;
		} else {
			renderPage(num);
		}
	}

	function onPrevPage() {
		if (pageNum <= 1) return;
		pageNum--;
		queueRenderPage(pageNum);
	}

	function onNextPage() {
		if (pageNum >= numPages) return;
		pageNum++;
		queueRenderPage(pageNum);
	}

	function zoomIn() {
		scale = Math.min(scale * 1.2, 3);
		queueRenderPage(pageNum);
	}

	function zoomOut() {
		scale = Math.max(scale / 1.2, 0.5);
		queueRenderPage(pageNum);
	}

	function fitToWidth() {
		// Simple fit to a reasonable default width
		scale = 1.0;
		queueRenderPage(pageNum);
	}

	// Watch for pdfData changes
	$: if (browser && pdfjsLib && pdfData && pdfData !== currentPdfData) {
		loadPdf(pdfData);
	}
</script>

<div class="bg-academic-gray-50 flex h-full flex-col">
	{#if pdfData}
		<div
			class="border-academic-border bg-academic-paper flex items-center justify-between border-b px-4 py-3 shadow-sm"
		>
			<div class="flex items-center gap-3">
				<button
					on:click={onPrevPage}
					disabled={pageNum <= 1}
					class="bg-academic-gray-100 text-academic-gray-700 hover:bg-academic-gray-200 rounded px-3 py-1.5 text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Previous
				</button>
				<span class="text-academic-gray-600 text-sm font-medium">
					Page {pageNum} of {numPages}
				</span>
				<button
					on:click={onNextPage}
					disabled={pageNum >= numPages}
					class="bg-academic-gray-100 text-academic-gray-700 hover:bg-academic-gray-200 rounded px-3 py-1.5 text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Next
				</button>
			</div>

			<div class="flex items-center gap-2">
				<button
					on:click={zoomOut}
					class="bg-academic-gray-100 text-academic-gray-700 hover:bg-academic-gray-200 rounded px-3 py-1.5 text-sm transition-colors duration-200"
					title="Zoom out"
				>
					−
				</button>
				<span class="text-academic-gray-600 min-w-12 text-center text-sm font-medium"
					>{Math.round(scale * 100)}%</span
				>
				<button
					on:click={zoomIn}
					class="bg-academic-gray-100 text-academic-gray-700 hover:bg-academic-gray-200 rounded px-3 py-1.5 text-sm transition-colors duration-200"
					title="Zoom in"
				>
					+
				</button>
				<button
					on:click={fitToWidth}
					class="bg-academic-gray-100 text-academic-gray-700 hover:bg-academic-gray-200 rounded px-3 py-1.5 text-sm transition-colors duration-200"
					title="Reset zoom to 100%"
				>
					Reset
				</button>
			</div>
		</div>

		<div class="bg-academic-gray-50 flex-1 overflow-auto p-6">
			<div class="relative mx-auto" style="width: fit-content">
				<canvas bind:this={canvas} class="shadow-lg"></canvas>
				<div bind:this={textLayer} class="textLayer absolute top-0 left-0"></div>
			</div>
		</div>
	{:else}
		<div class="flex h-full flex-col items-center justify-center text-gray-500">
			<svg class="mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
			<p class="text-lg">No PDF to display</p>
			<p class="mt-2 text-sm">Click "Compile" to generate a PDF</p>
		</div>
	{/if}
</div>

<style>
	:global(.textLayer) {
		opacity: 0.2;
		line-height: 1;
	}

	:global(.textLayer > span) {
		color: transparent;
		position: absolute;
		white-space: pre;
		cursor: text;
		transform-origin: 0% 0%;
	}

	:global(.textLayer ::selection) {
		background: blue;
		opacity: 0.5;
	}
</style>
