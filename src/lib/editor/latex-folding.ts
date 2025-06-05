import { foldService, foldNodeProp, foldInside } from '@codemirror/language';
import { EditorState } from '@codemirror/state';

/**
 * Simple LaTeX folding service that identifies foldable regions
 * based on LaTeX-specific patterns.
 */
export const latexFoldService = foldService.of(
	(state: EditorState, lineStart: number, lineEnd: number) => {
		const line = state.doc.lineAt(lineStart);
		const lineText = line.text;

		// Fold \begin{...} to \end{...} environments
		const beginMatch = lineText.match(/\\begin\{(\w+)\}/);
		if (beginMatch) {
			const envName = beginMatch[1];
			const endPattern = new RegExp(`\\\\end\\{${envName}\\}`);

			// Search for the corresponding \end{...}
			for (let i = line.number + 1; i <= state.doc.lines; i++) {
				const searchLine = state.doc.line(i);
				if (endPattern.test(searchLine.text)) {
					return {
						from: line.to,
						to: searchLine.to
					};
				}
			}
		}

		// Fold sections
		const sectionMatch = lineText.match(
			/\\(chapter|section|subsection|subsubsection|paragraph|subparagraph)\{/
		);
		if (sectionMatch) {
			const sectionLevel = getSectionLevel(sectionMatch[1]);

			// Find the next section at the same or higher level
			for (let i = line.number + 1; i <= state.doc.lines; i++) {
				const searchLine = state.doc.line(i);
				const nextSectionMatch = searchLine.text.match(
					/\\(chapter|section|subsection|subsubsection|paragraph|subparagraph)\{/
				);

				if (nextSectionMatch) {
					const nextLevel = getSectionLevel(nextSectionMatch[1]);
					if (nextLevel <= sectionLevel) {
						return {
							from: line.to,
							to: state.doc.line(i - 1).to
						};
					}
				}
			}

			// If no next section found, fold to end of document
			if (line.number < state.doc.lines) {
				return {
					from: line.to,
					to: state.doc.length - 1
				};
			}
		}

		// Fold multiline comments
		if (lineText.trim().startsWith('%')) {
			let endLine = line.number;

			// Find consecutive comment lines
			for (let i = line.number + 1; i <= state.doc.lines; i++) {
				const nextLine = state.doc.line(i);
				if (nextLine.text.trim().startsWith('%')) {
					endLine = i;
				} else {
					break;
				}
			}

			if (endLine > line.number) {
				return {
					from: line.to,
					to: state.doc.line(endLine).to
				};
			}
		}

		// Fold curly braces for multi-line content
		const openBrace = lineText.lastIndexOf('{');
		if (openBrace !== -1 && !lineText.includes('}', openBrace)) {
			let braceCount = 1;

			for (let i = line.number + 1; i <= state.doc.lines && braceCount > 0; i++) {
				const searchLine = state.doc.line(i);
				for (const char of searchLine.text) {
					if (char === '{') braceCount++;
					else if (char === '}') braceCount--;
				}

				if (braceCount === 0) {
					if (i > line.number + 1) {
						// Only fold if it spans multiple lines
						return {
							from: line.to,
							to: state.doc.line(i).to
						};
					}
					break;
				}
			}
		}

		return null;
	}
);

/**
 * Helper function to get section hierarchy level
 */
function getSectionLevel(sectionType: string): number {
	const levels: Record<string, number> = {
		chapter: 0,
		section: 1,
		subsection: 2,
		subsubsection: 3,
		paragraph: 4,
		subparagraph: 5
	};
	return levels[sectionType] || 999;
}

/**
 * Simple syntax node folding for JavaScript syntax
 * (used as fallback since we're using JavaScript highlighting)
 */
export const syntaxFolding = foldNodeProp.add({
	Block: foldInside,
	ObjectExpression: foldInside,
	ArrayExpression: foldInside,
	FunctionDeclaration: (node) => {
		const bodyNode = node.getChild('Block');
		if (bodyNode) {
			return { from: bodyNode.from + 1, to: bodyNode.to - 1 };
		}
		return null;
	}
});
