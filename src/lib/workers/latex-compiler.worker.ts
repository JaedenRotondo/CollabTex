/// <reference lib="webworker" />

import { browserLatexEngine } from '../latex/browser-latex-engine';

interface CompileMessage {
	type: 'compile';
	content: string;
}

// Handle messages from the main thread
self.addEventListener('message', async (event: MessageEvent<CompileMessage>) => {
	if (event.data.type === 'compile') {
		try {
			const result = await browserLatexEngine.compile(event.data.content);

			if (result.success && result.pdf) {
				self.postMessage(
					{
						type: 'compiled',
						pdf: result.pdf,
						log: result.log
					},
					[result.pdf]
				);
			} else {
				self.postMessage({
					type: 'error',
					error: result.errors[0]?.message || 'Compilation failed',
					log: result.log
				});
			}
		} catch (error) {
			self.postMessage({
				type: 'error',
				error: error instanceof Error ? error.message : 'Unknown error',
				log: error instanceof Error ? error.stack : ''
			});
		}
	}
});
