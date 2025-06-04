import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const LATEX_SERVER_URL = 'https://latex-server-q7ci.onrender.com';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		
		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Forward the request to the LaTeX server
		const serverFormData = new FormData();
		serverFormData.append('file', file);

		const response = await fetch(`${LATEX_SERVER_URL}/compile`, {
			method: 'POST',
			headers: {
				'Accept': 'application/pdf'
			},
			body: serverFormData
		});

		if (!response.ok) {
			const errorText = await response.text();
			return json(
				{ error: `LaTeX compilation failed: ${errorText}` },
				{ status: response.status }
			);
		}

		// Get the PDF data
		const pdfBuffer = await response.arrayBuffer();

		// Return the PDF with appropriate headers
		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Length': pdfBuffer.byteLength.toString()
			}
		});
	} catch (error) {
		console.error('Compilation proxy error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};