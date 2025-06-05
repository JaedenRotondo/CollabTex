export interface CompileError {
	line?: number;
	column?: number;
	message: string;
	file?: string;
	type: 'error' | 'warning';
}

export interface CompileResult {
	pdf?: ArrayBuffer;
	log?: string;
	error?: string;
	errors?: CompileError[];
}

let worker: Worker | null = null;
let useServerCompilation = false;
let serverUrl = '';

export function configureCompiler(options: { useServer: boolean; serverUrl?: string }) {
	useServerCompilation = options.useServer;
	serverUrl = options.serverUrl || 'http://localhost:8000';

	// Clear existing worker if switching compilation mode
	if (worker) {
		worker.terminate();
		worker = null;
	}
}

export async function compileLatex(content: string): Promise<CompileResult> {
	if (!worker) {
		if (useServerCompilation) {
			worker = new Worker(new URL('../workers/server-latex-compiler.worker.ts', import.meta.url), {
				type: 'module'
			});
		} else {
			worker = new Worker(new URL('../workers/latex-compiler.worker.ts', import.meta.url), {
				type: 'module'
			});
		}
	}

	return new Promise((resolve) => {
		const messageHandler = (e: MessageEvent) => {
			if (e.data.type === 'compiled') {
				worker?.removeEventListener('message', messageHandler);
				const errors = parseLatexLog(e.data.log || '');
				resolve({
					pdf: e.data.pdf,
					log: e.data.log,
					errors: errors.length > 0 ? errors : undefined
				});
			} else if (e.data.type === 'error') {
				worker?.removeEventListener('message', messageHandler);
				const errors = parseLatexLog(e.data.log || '');
				resolve({
					error: e.data.error,
					log: e.data.log,
					errors:
						errors.length > 0
							? errors
							: [
									{
										message: e.data.error || 'Compilation failed',
										type: 'error'
									}
								]
				});
			}
		};

		worker!.addEventListener('message', messageHandler);

		// Both workers now use the same message format
		worker!.postMessage({ type: 'compile', content });
	});
}

function parseLatexLog(log: string): CompileError[] {
	const errors: CompileError[] = [];
	const lines = log.split('\n');

	// Simple error parsing - can be enhanced
	const errorRegex = /^! (.+)$/;
	const lineRegex = /^l\.(\d+)/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const errorMatch = line.match(errorRegex);

		if (errorMatch) {
			const error: CompileError = {
				message: errorMatch[1],
				type: 'error'
			};

			// Look for line number in next few lines
			for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
				const lineMatch = lines[j].match(lineRegex);
				if (lineMatch) {
					error.line = parseInt(lineMatch[1], 10);
					break;
				}
			}

			errors.push(error);
		}

		// Also catch LaTeX warnings
		if (line.includes('LaTeX Warning:') || line.includes('Package Warning:')) {
			errors.push({
				message: line.replace(/.*Warning:\s*/, ''),
				type: 'warning'
			});
		}
	}

	return errors;
}
