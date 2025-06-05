import { EditorView } from '@codemirror/view';

/**
 * Custom fold gutter theme matching the Overleaf/CollabTex design
 */
export const foldGutterTheme = EditorView.theme({
	'.cm-foldGutter': {
		width: '12px'
	},
	'.cm-foldGutter .cm-gutterElement': {
		padding: '0 2px',
		cursor: 'pointer',
		color: '#999',
		transition: 'color 0.2s'
	},
	'.cm-foldGutter .cm-gutterElement:hover': {
		color: '#468847' // Overleaf green
	},
	'.cm-foldPlaceholder': {
		backgroundColor: '#f5f5f5',
		border: '1px solid #ddd',
		color: '#666',
		borderRadius: '3px',
		padding: '0 6px',
		margin: '0 2px',
		cursor: 'pointer',
		fontSize: '11px',
		transition: 'all 0.2s'
	},
	'.cm-foldPlaceholder:hover': {
		backgroundColor: '#e8e8e8',
		borderColor: '#468847',
		color: '#468847'
	}
});
