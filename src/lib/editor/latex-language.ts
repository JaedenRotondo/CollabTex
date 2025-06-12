import { StreamLanguage } from '@codemirror/language';

/**
 * LaTeX language mode for CodeMirror 6
 * Based on the Stex mode but adapted for CodeMirror 6
 */

interface LatexState {
	inMath: boolean;
	mathDelimiter: string | null;
	commandStack: string[];
}

const latexLanguage = StreamLanguage.define<LatexState>({
	name: 'latex',
	startState(): LatexState {
		return {
			inMath: false,
			mathDelimiter: null,
			commandStack: []
		};
	},

	token(stream, state) {
		// Handle math mode
		if (state.inMath) {
			return handleMathMode(stream, state);
		}

		// Skip whitespace
		if (stream.eatSpace()) {
			return null;
		}

		// Comments
		if (stream.match('%')) {
			stream.skipToEnd();
			return 'comment';
		}

		// Math mode delimiters
		if (stream.match('\\[')) {
			state.inMath = true;
			state.mathDelimiter = '\\]';
			return 'keyword';
		}
		if (stream.match('\\(')) {
			state.inMath = true;
			state.mathDelimiter = '\\)';
			return 'keyword';
		}
		if (stream.match('$$')) {
			state.inMath = true;
			state.mathDelimiter = '$$';
			return 'keyword';
		}
		if (stream.match('$')) {
			state.inMath = true;
			state.mathDelimiter = '$';
			return 'keyword';
		}

		// LaTeX commands
		if (stream.match(/^\\[a-zA-Z@]+/)) {
			const command = stream.current().slice(1);

			// Document structure commands
			if (['documentclass', 'usepackage', 'begin', 'end'].includes(command)) {
				return 'def';
			}

			// Sectioning commands
			if (
				[
					'part',
					'chapter',
					'section',
					'subsection',
					'subsubsection',
					'paragraph',
					'subparagraph'
				].includes(command)
			) {
				return 'strong';
			}

			// Text formatting
			if (['textbf', 'textit', 'emph', 'underline', 'texttt', 'textsc'].includes(command)) {
				return 'emphasis';
			}

			// References and labels
			if (
				['label', 'ref', 'eqref', 'cite', 'bibliography', 'bibliographystyle'].includes(command)
			) {
				return 'link';
			}

			// Math commands
			if (
				[
					'frac',
					'sqrt',
					'sum',
					'int',
					'prod',
					'lim',
					'alpha',
					'beta',
					'gamma',
					'delta',
					'theta',
					'lambda',
					'pi',
					'sigma'
				].includes(command)
			) {
				return 'atom';
			}

			// Default command style
			return 'keyword';
		}

		// Escape characters
		if (stream.match(/^\\[$&%#{}_]/)) {
			return 'escape';
		}

		// White space control characters
		if (stream.match(/^\\[,;!\/\\]/)) {
			return 'escape';
		}

		// Braces and brackets
		if (stream.match(/^[{}[\]]/)) {
			return 'bracket';
		}

		// Numbers
		if (stream.match(/^\d+(\.\d*)?/)) {
			return 'number';
		}

		// Regular text
		stream.next();
		return null;
	},

	blankLine(state) {
		// Reset some state on blank lines
		state.commandStack = [];
	},

	languageData: {
		commentTokens: { line: '%' },
		indentOnInput: /^\s*\\(end|item)\b/,
		wordChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
	}
});

function handleMathMode(stream: any, state: LatexState) {
	// Check for math mode end
	if (state.mathDelimiter && stream.match(state.mathDelimiter)) {
		state.inMath = false;
		state.mathDelimiter = null;
		return 'keyword';
	}

	// Skip whitespace in math mode
	if (stream.eatSpace()) {
		return null;
	}

	// Comments in math mode
	if (stream.match('%')) {
		stream.skipToEnd();
		return 'comment';
	}

	// Math commands
	if (stream.match(/^\\[a-zA-Z@]+/)) {
		return 'atom';
	}

	// Math symbols and operators
	if (stream.match(/^[\^_&]/)) {
		return 'operator';
	}

	// Numbers in math mode
	if (stream.match(/^\d+(\.\d*)?/)) {
		return 'number';
	}

	// Variables in math mode
	if (stream.match(/^[a-zA-Z]+/)) {
		return 'variable';
	}

	// Math operators and symbols
	if (stream.match(/^[+\-<>=,\/@!*:;'"`~#?]/)) {
		return 'operator';
	}

	// Brackets in math mode
	if (stream.match(/^[{}[\]()]/)) {
		return 'bracket';
	}

	// Escape characters in math mode
	if (stream.match(/^\\[$&%#{}_]/)) {
		return 'escape';
	}

	// Default: consume character
	stream.next();
	return null;
}

export function latex() {
	return latexLanguage;
}
