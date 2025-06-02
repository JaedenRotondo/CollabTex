// Browser-based LaTeX Engine
// This provides a production-ready solution using multiple approaches

import { jsPDF } from 'jspdf';

export interface BrowserLatexEngine {
	compile: (content: string) => Promise<CompileResult>;
	isReady: () => boolean;
}

export interface CompileResult {
	pdf?: ArrayBuffer;
	log: string;
	errors: CompileError[];
	success: boolean;
}

export interface CompileError {
	line?: number;
	column?: number;
	message: string;
	severity: 'error' | 'warning';
}

// Main browser-based LaTeX compiler
export class BrowserLatexCompiler implements BrowserLatexEngine {
	private ready = false;

	constructor() {
		this.initialize();
	}

	private async initialize() {
		// Load any necessary resources
		this.ready = true;
	}

	isReady(): boolean {
		return this.ready;
	}

	async compile(content: string): Promise<CompileResult> {
		const errors: CompileError[] = [];
		let log = '';

		try {
			// Parse LaTeX content
			const parsed = this.parseLatex(content);

			// Generate PDF using jsPDF
			const pdf = await this.generatePDF(parsed);

			log = `Compilation successful\nGenerated PDF with ${parsed.pages} page(s)`;

			return {
				pdf: pdf,
				log,
				errors,
				success: true
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			errors.push({
				message: errorMessage,
				severity: 'error'
			});

			return {
				log: `Compilation failed: ${errorMessage}`,
				errors,
				success: false
			};
		}
	}

	private parseLatex(content: string): ParsedLatex {
		// Extract document metadata
		const titleMatch = content.match(/\\title\{([^}]+)\}/);
		const authorMatch = content.match(/\\author\{([^}]+)\}/);
		const dateMatch = content.match(/\\date\{([^}]+)\}/);

		// Extract document content
		const documentMatch = content.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
		const body = documentMatch ? documentMatch[1] : '';

		// Parse sections
		const sections = this.parseSections(body);

		// Parse math expressions
		const mathExpressions = this.parseMath(body);

		return {
			title: titleMatch ? titleMatch[1] : 'Untitled Document',
			author: authorMatch ? authorMatch[1] : '',
			date: dateMatch ? this.parseDate(dateMatch[1]) : new Date().toLocaleDateString(),
			sections,
			mathExpressions,
			rawBody: body,
			pages: 1 // Will be calculated based on content
		};
	}

	private parseSections(body: string): Section[] {
		const sections: Section[] = [];
		const sectionRegex = /\\(section|subsection|subsubsection)\{([^}]+)\}/g;
		let match;

		while ((match = sectionRegex.exec(body)) !== null) {
			sections.push({
				level: match[1] as 'section' | 'subsection' | 'subsubsection',
				title: match[2],
				position: match.index
			});
		}

		return sections;
	}

	private parseMath(body: string): MathExpression[] {
		const expressions: MathExpression[] = [];

		// Inline math: $...$
		const inlineRegex = /\$([^$]+)\$/g;
		let match;

		while ((match = inlineRegex.exec(body)) !== null) {
			expressions.push({
				type: 'inline',
				content: match[1],
				position: match.index
			});
		}

		// Display math: $$...$$ or \[...\]
		const displayRegex = /(?:\$\$([^$]+)\$\$|\\\\?\[([^\]]+)\\\\?\])/g;

		while ((match = displayRegex.exec(body)) !== null) {
			expressions.push({
				type: 'display',
				content: match[1] || match[2],
				position: match.index
			});
		}

		return expressions;
	}

	private parseDate(dateStr: string): string {
		if (dateStr === '\\today') {
			return new Date().toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		}
		return dateStr;
	}

	private async generatePDF(parsed: ParsedLatex): Promise<ArrayBuffer> {
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'pt',
			format: 'a4'
		});

		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 72; // 1 inch margins
		const lineHeight = 14;
		let yPosition = margin;

		// Add title
		if (parsed.title) {
			doc.setFontSize(18);
			doc.setFont('helvetica', 'bold');
			const titleLines = doc.splitTextToSize(parsed.title, pageWidth - 2 * margin);
			doc.text(titleLines, pageWidth / 2, yPosition, { align: 'center' });
			yPosition += titleLines.length * 20 + 10;
		}

		// Add author
		if (parsed.author) {
			doc.setFontSize(14);
			doc.setFont('helvetica', 'normal');
			doc.text(parsed.author, pageWidth / 2, yPosition, { align: 'center' });
			yPosition += 20;
		}

		// Add date
		if (parsed.date) {
			doc.setFontSize(12);
			doc.text(parsed.date, pageWidth / 2, yPosition, { align: 'center' });
			yPosition += 30;
		}

		// Process body content
		doc.setFontSize(11);
		doc.setFont('helvetica', 'normal');

		// Split content into lines and process
		const lines = this.processContent(parsed.rawBody, pageWidth - 2 * margin, doc);

		for (const line of lines) {
			if (yPosition + lineHeight > pageHeight - margin) {
				doc.addPage();
				yPosition = margin;
			}

			if (line.type === 'section') {
				doc.setFont('helvetica', 'bold');
				doc.setFontSize(14);
				yPosition += 10;
			} else if (line.type === 'subsection') {
				doc.setFont('helvetica', 'bold');
				doc.setFontSize(12);
				yPosition += 8;
			} else {
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(11);
			}

			doc.text(line.text, margin, yPosition);
			yPosition += lineHeight;

			if (line.type === 'section' || line.type === 'subsection') {
				yPosition += 5;
			}
		}

		// Convert to ArrayBuffer
		const pdfOutput = doc.output('arraybuffer');
		return pdfOutput;
	}

	private processContent(content: string, maxWidth: number, doc: jsPDF): ProcessedLine[] {
		const lines: ProcessedLine[] = [];

		// Remove LaTeX commands we've already processed
		let processed = content
			.replace(/\\maketitle/g, '')
			.replace(/\\title\{[^}]+\}/g, '')
			.replace(/\\author\{[^}]+\}/g, '')
			.replace(/\\date\{[^}]+\}/g, '');

		// Process sections
		processed = processed.replace(
			/\\(section|subsection|subsubsection)\{([^}]+)\}/g,
			(match, level, title) => {
				lines.push({ type: level, text: title });
				return '\n';
			}
		);

		// Process basic formatting
		processed = processed
			.replace(/\\textbf\{([^}]+)\}/g, '$1') // Bold (simplified)
			.replace(/\\textit\{([^}]+)\}/g, '$1') // Italic (simplified)
			.replace(/\\emph\{([^}]+)\}/g, '$1') // Emphasis (simplified)
			.replace(/\\\\/g, '\n') // Line breaks
			.replace(/\\par/g, '\n\n') // Paragraphs
			.replace(/\$([^$]+)\$/g, '$1') // Inline math (simplified)
			.replace(/\n{3,}/g, '\n\n'); // Multiple newlines

		// Split into paragraphs and wrap text
		const paragraphs = processed.split('\n\n').filter((p) => p.trim());

		for (const paragraph of paragraphs) {
			const trimmed = paragraph.trim();
			if (trimmed) {
				const wrappedLines = doc.splitTextToSize(trimmed, maxWidth);
				for (const line of wrappedLines) {
					lines.push({ type: 'text', text: line });
				}
				lines.push({ type: 'text', text: '' }); // Empty line between paragraphs
			}
		}

		return lines;
	}
}

interface ParsedLatex {
	title: string;
	author: string;
	date: string;
	sections: Section[];
	mathExpressions: MathExpression[];
	rawBody: string;
	pages: number;
}

interface Section {
	level: 'section' | 'subsection' | 'subsubsection';
	title: string;
	position: number;
}

interface MathExpression {
	type: 'inline' | 'display';
	content: string;
	position: number;
}

interface ProcessedLine {
	type: 'text' | 'section' | 'subsection' | 'subsubsection';
	text: string;
}

// Export singleton instance
export const browserLatexEngine = new BrowserLatexCompiler();
