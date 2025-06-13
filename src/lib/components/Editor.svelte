<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { EditorState } from '@codemirror/state';
	import { latex } from '$lib/editor/latex-language';
	import { autocompletion } from '@codemirror/autocomplete';
	import { codeFolding, foldGutter, foldKeymap } from '@codemirror/language';
	import { keymap } from '@codemirror/view';
	import * as Y from 'yjs';
	import { yCollab } from 'y-codemirror.next';
	import { latexCompletions } from '$lib/editor/latex-completions';
	import { latexFoldService } from '$lib/editor/latex-folding';
	import { foldGutterTheme } from '$lib/editor/fold-gutter-theme';
	import type { WebrtcProvider } from 'y-webrtc';

	export let ydoc: Y.Doc;
	export let provider: WebrtcProvider;
	export let mainContent: Y.Text;
	export let readonly: boolean = false;

	let editorContainer: HTMLDivElement;
	let view: EditorView | undefined;

	// Set up editor initialization
	onMount(() => {
		// Initialize editor when component is mounted and props are ready
		if (ydoc && provider && mainContent && editorContainer && !view) {
			initializeEditor();
		}
	});

	// Reactive initialization when props are ready
	$: if (ydoc && provider && mainContent && editorContainer && !view) {
		initializeEditor();
	}

	function initializeEditor() {
		console.log('Initializing CodeMirror editor...');

		if (!ydoc || !provider || !mainContent) {
			console.warn('Editor: ydoc, provider, or mainContent not ready');
			return;
		}

		const undoManager = new Y.UndoManager(mainContent);

		const state = EditorState.create({
			doc: mainContent.toString(),
			extensions: [
				basicSetup,
				latex(), // LaTeX syntax highlighting
				createTheme(),
				foldGutterTheme,
				autocompletion({
					override: [latexCompletions]
				}),
				yCollab(mainContent, provider.awareness, { undoManager }),
				EditorView.lineWrapping,
				codeFolding(),
				foldGutter(),
				keymap.of(foldKeymap),
				latexFoldService,
				...(readonly ? [EditorState.readOnly.of(true)] : [])
			]
		});

		view = new EditorView({
			state,
			parent: editorContainer
		});

		console.log('CodeMirror editor initialized');
	}

	function createTheme() {
		return EditorView.theme({
			'&': {
				height: '100%',
				fontSize: '14px',
				backgroundColor: '#FFFFFF'
			},
			'.cm-content': {
				fontFamily:
					'"JetBrains Mono", "Fira Code", Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
				padding: '20px',
				lineHeight: '1.6',
				color: '#2C2C2C'
			},
			'.cm-scroller': {
				fontFamily:
					'"JetBrains Mono", "Fira Code", Monaco, Menlo, "Ubuntu Mono", Consolas, monospace'
			},
			'.cm-focused .cm-cursor': {
				borderLeftColor: '#138A36'
			},
			'.cm-focused .cm-selectionBackground, ::selection': {
				backgroundColor: '#4A90E2'
			},
			'.cm-gutters': {
				backgroundColor: '#F8F9FA',
				borderRight: '1px solid #E1E4E8',
				color: '#757575'
			},
			'.cm-lineNumbers .cm-gutterElement': {
				color: '#BDBDBD',
				fontSize: '13px'
			},
			'.cm-activeLineGutter': {
				backgroundColor: '#E8F2FF'
			}
		});
	}

	export function foldAllSections() {
		if (!view) return;
		// Simple folding implementation - this can be improved later
		console.log('Fold all sections requested');
	}

	export function unfoldAllSections() {
		if (!view) return;
		// Simple unfolding implementation - this can be improved later
		console.log('Unfold all sections requested');
	}

	onDestroy(() => {
		if (view) {
			view.destroy();
		}
	});
</script>

<div bind:this={editorContainer} class="h-full w-full"></div>