<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { EditorState } from '@codemirror/state';
	import { javascript } from '@codemirror/lang-javascript';
	import { autocompletion } from '@codemirror/autocomplete';
	import * as Y from 'yjs';
	import { yCollab } from 'y-codemirror.next';
	import { latexCompletions } from '$lib/editor/latex-completions';
	import type { WebrtcProvider } from 'y-webrtc';

	export let ydoc: Y.Doc;
	export let provider: WebrtcProvider;

	let editorContainer: HTMLDivElement;
	let view: EditorView | undefined;

	// Reactive initialization when props are ready
	$: if (ydoc && provider && editorContainer && !view) {
		initializeEditor();
	}

	function initializeEditor() {
		console.log('Initializing CodeMirror editor...');
		
		if (!ydoc || !provider) {
			console.warn('Editor: ydoc or provider not ready');
			return;
		}

		const ytext = ydoc.getText('latex-content');
		const undoManager = new Y.UndoManager(ytext);

		const theme = EditorView.theme({
			'&': {
				height: '100%',
				fontSize: '14px'
			},
			'.cm-content': {
				fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
				padding: '16px'
			},
			'.cm-scroller': {
				fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace'
			},
			'.cm-focused .cm-cursor': {
				borderLeftColor: '#468847'
			},
			'.cm-focused .cm-selectionBackground, ::selection': {
				backgroundColor: '#d7e4f2'
			},
			'.cm-gutters': {
				backgroundColor: '#f8f8f8',
				borderRight: '1px solid #ddd'
			}
		});

		const state = EditorState.create({
			doc: ytext.toString(),
			extensions: [
				basicSetup,
				javascript(), // We'll use JS highlighting for now as LaTeX isn't available
				theme,
				autocompletion({
					override: [latexCompletions]
				}),
				yCollab(ytext, provider.awareness, { undoManager }),
				EditorView.lineWrapping
			]
		});

		view = new EditorView({
			state,
			parent: editorContainer
		});
		
		console.log('CodeMirror editor initialized');
	}

	onDestroy(() => {
		console.log('Destroying CodeMirror editor');
		view?.destroy();
	});
</script>

<div bind:this={editorContainer} class="h-full w-full overflow-hidden"></div>

<style>
	:global(.cm-editor) {
		height: 100%;
	}

	:global(.cm-ySelectionInfo) {
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
		color: white;
		position: absolute;
		top: -1.5em;
		left: 0;
		opacity: 0.8;
		transition: opacity 0.3s;
		z-index: 100;
		white-space: nowrap;
	}
</style>
