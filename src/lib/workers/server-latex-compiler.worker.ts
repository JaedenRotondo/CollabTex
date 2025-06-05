/// <reference lib="webworker" />

interface CompileMessage {
	type: 'compile';
	content: string;
	serverUrl?: string; // Now optional since we'll use our proxy
}

interface CompileError {
	line?: number;
	column?: number;
	message: string;
	file?: string;
	type: 'error' | 'warning';
}

async function compileOnServer(content: string) {
	const formData = new FormData();
	const blob = new Blob([content], { type: 'text/plain' });
	formData.append('file', blob, 'document.tex');

	try {
		// Use our proxy endpoint to avoid CORS issues
		const response = await fetch('/api/compile', {
			method: 'POST',
			headers: {
				Accept: 'application/pdf'
			},
			body: formData
		});

		if (!response.ok) {
			let errorText;
			try {
				const errorData = await response.json();
				errorText = errorData.error || 'Compilation failed';
			} catch {
				errorText = await response.text();
			}
			throw new Error(`Compilation failed (${response.status}): ${errorText}`);
		}

		const pdfBuffer = await response.arrayBuffer();
		
		return {
			pdf: pdfBuffer,
			log: 'Compilation successful'
		};
	} catch (error) {
		if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
			throw new Error('Unable to connect to compilation server');
		}
		throw error;
	}
}

self.addEventListener('message', async (event: MessageEvent<CompileMessage>) => {
	if (event.data.type === 'compile') {
		try {
			const result = await compileOnServer(event.data.content);

			// Clone the ArrayBuffer to avoid transfer issues
			const pdfCopy = result.pdf.slice();
			
			self.postMessage({
				type: 'compiled',
				pdf: pdfCopy,
				log: result.log
			});
		} catch (error) {
			self.postMessage({
				type: 'error',
				error: error instanceof Error ? error.message : 'Unknown error',
				log: error instanceof Error ? error.stack : ''
			});
		}
	}
});
