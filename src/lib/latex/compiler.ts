export interface CompileResult {
	pdf?: ArrayBuffer;
	log?: string;
	error?: string;
}

let worker: Worker | null = null;

export async function compileLatex(content: string): Promise<CompileResult> {
	if (!worker) {
		worker = new Worker(new URL('../workers/latex-compiler.worker.ts', import.meta.url), {
			type: 'module'
		});
	}

	return new Promise((resolve) => {
		const messageHandler = (e: MessageEvent) => {
			if (e.data.type === 'compiled') {
				worker?.removeEventListener('message', messageHandler);
				resolve({
					pdf: e.data.pdf,
					log: e.data.log
				});
			} else if (e.data.type === 'error') {
				worker?.removeEventListener('message', messageHandler);
				resolve({
					error: e.data.error,
					log: e.data.log
				});
			}
		};

		worker!.addEventListener('message', messageHandler);
		worker!.postMessage({ type: 'compile', content });
	});
}
