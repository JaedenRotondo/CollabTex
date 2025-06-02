import type { CompletionContext } from '@codemirror/autocomplete';

const latexCommands = [
	// Document structure
	{ label: '\\documentclass', type: 'keyword', info: 'Document class declaration' },
	{ label: '\\usepackage', type: 'keyword', info: 'Import a package' },
	{ label: '\\begin', type: 'keyword', info: 'Begin an environment' },
	{ label: '\\end', type: 'keyword', info: 'End an environment' },
	{ label: '\\section', type: 'keyword', info: 'Create a section' },
	{ label: '\\subsection', type: 'keyword', info: 'Create a subsection' },
	{ label: '\\subsubsection', type: 'keyword', info: 'Create a subsubsection' },
	{ label: '\\chapter', type: 'keyword', info: 'Create a chapter' },
	{ label: '\\paragraph', type: 'keyword', info: 'Create a paragraph' },
	{ label: '\\subparagraph', type: 'keyword', info: 'Create a subparagraph' },

	// Text formatting
	{ label: '\\textbf', type: 'function', info: 'Bold text' },
	{ label: '\\textit', type: 'function', info: 'Italic text' },
	{ label: '\\underline', type: 'function', info: 'Underlined text' },
	{ label: '\\emph', type: 'function', info: 'Emphasized text' },
	{ label: '\\texttt', type: 'function', info: 'Typewriter text' },
	{ label: '\\textsc', type: 'function', info: 'Small caps text' },

	// Math
	{ label: '\\frac', type: 'function', info: 'Fraction' },
	{ label: '\\sqrt', type: 'function', info: 'Square root' },
	{ label: '\\sum', type: 'function', info: 'Summation' },
	{ label: '\\int', type: 'function', info: 'Integral' },
	{ label: '\\prod', type: 'function', info: 'Product' },
	{ label: '\\lim', type: 'function', info: 'Limit' },
	{ label: '\\infty', type: 'variable', info: 'Infinity symbol' },
	{ label: '\\alpha', type: 'variable', info: 'Greek letter alpha' },
	{ label: '\\beta', type: 'variable', info: 'Greek letter beta' },
	{ label: '\\gamma', type: 'variable', info: 'Greek letter gamma' },
	{ label: '\\delta', type: 'variable', info: 'Greek letter delta' },
	{ label: '\\theta', type: 'variable', info: 'Greek letter theta' },
	{ label: '\\lambda', type: 'variable', info: 'Greek letter lambda' },
	{ label: '\\pi', type: 'variable', info: 'Greek letter pi' },
	{ label: '\\sigma', type: 'variable', info: 'Greek letter sigma' },

	// Environments
	{ label: 'equation', type: 'class', info: 'Equation environment' },
	{ label: 'align', type: 'class', info: 'Align environment' },
	{ label: 'itemize', type: 'class', info: 'Itemize environment' },
	{ label: 'enumerate', type: 'class', info: 'Enumerate environment' },
	{ label: 'figure', type: 'class', info: 'Figure environment' },
	{ label: 'table', type: 'class', info: 'Table environment' },
	{ label: 'tabular', type: 'class', info: 'Tabular environment' },
	{ label: 'verbatim', type: 'class', info: 'Verbatim environment' },

	// References
	{ label: '\\ref', type: 'function', info: 'Reference' },
	{ label: '\\label', type: 'function', info: 'Label' },
	{ label: '\\cite', type: 'function', info: 'Citation' },
	{ label: '\\bibliography', type: 'keyword', info: 'Bibliography' },
	{ label: '\\bibliographystyle', type: 'keyword', info: 'Bibliography style' },

	// Other common commands
	{ label: '\\includegraphics', type: 'function', info: 'Include graphics' },
	{ label: '\\caption', type: 'function', info: 'Caption' },
	{ label: '\\newcommand', type: 'keyword', info: 'Define new command' },
	{ label: '\\renewcommand', type: 'keyword', info: 'Redefine command' },
	{ label: '\\item', type: 'keyword', info: 'List item' }
];

export function latexCompletions(context: CompletionContext) {
	const word = context.matchBefore(/\\?\w*/);
	if (!word || (word.from === word.to && !context.explicit)) return null;

	const isAfterBackslash = context.state.sliceDoc(word.from - 1, word.from) === '\\';
	const searchTerm = word.text.toLowerCase();

	const options = latexCommands
		.filter((cmd) => {
			const label = cmd.label.toLowerCase();
			if (isAfterBackslash && !searchTerm.startsWith('\\')) {
				return label.slice(1).startsWith(searchTerm);
			}
			return label.startsWith(searchTerm);
		})
		.map((cmd) => ({
			label: cmd.label,
			type: cmd.type,
			info: cmd.info,
			apply: isAfterBackslash && !searchTerm.startsWith('\\') ? cmd.label.slice(1) : cmd.label
		}));

	return {
		from: word.from,
		options,
		validFor: /^\\?\w*$/
	};
}
