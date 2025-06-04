import { LATEX_SERVER_URL } from '$env/static/private';
import type { CompileError, CompileResult } from './compiler';

export interface ServerLatexEngine {
	compile: (content: string) => Promise<CompileResult>;
	isReady: () => boolean;
}

export class ServerLatexCompiler implements ServerLatexEngine {
	private serverUrl: string;

	constructor() {
		this.serverUrl = LATEX_SERVER_URL || 'http://localhost:8000';
	}

	isReady(): boolean {
		return true;
	}

	async compile(content: string): Promise<CompileResult> {
		try {
			const formData = new FormData();
			const blob = new Blob([content], { type: 'text/plain' });
			formData.append('file', blob, 'document.tex');

			const response = await fetch(`${this.serverUrl}/compile`, {
				method: 'POST',
				headers: {
					'Accept': 'application/pdf'
				},
				body: formData
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					error: `Server compilation failed: ${response.statusText}`,
					log: errorText,
					errors: [{
						message: `Compilation failed with status ${response.status}: ${errorText}`,
						type: 'error'
					}]
				};
			}

			const pdfBuffer = await response.arrayBuffer();
			
			return {
				pdf: pdfBuffer,
				log: 'Compilation successful',
				errors: []
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				error: `Failed to connect to LaTeX server: ${errorMessage}`,
				log: '',
				errors: [{
					message: `Server connection failed: ${errorMessage}`,
					type: 'error'
				}]
			};
		}
	}
}

export const serverLatexEngine = new ServerLatexCompiler();