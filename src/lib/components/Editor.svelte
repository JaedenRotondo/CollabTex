<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { EditorState } from '@codemirror/state';
	import { javascript } from '@codemirror/lang-javascript';
	import { autocompletion } from '@codemirror/autocomplete';
	import * as Y from 'yjs';
	import { yCollab } from 'y-codemirror.next';
	import { latexCompletions } from '$lib/editor/latex-completions';
	import type { WebrtcProvider } from 'y-webrtc';
	import type { FileNode } from '$lib/collaboration/yjs-setup';

	export let ydoc: Y.Doc;
	export let provider: WebrtcProvider;
	export let files: Y.Map<FileNode>;
	export let activeFile: Y.Map<{ id: string }>;

	let editorContainer: HTMLDivElement;
	let view: EditorView | undefined;
	let currentFileId: string | null = null;
	let ytext: Y.Text | undefined;

	// Set up observer for active file changes
	onMount(() => {
		if (activeFile) {
			const observer = () => {
				const activeData = activeFile.get('id');
				const fileId = typeof activeData === 'object' && activeData?.id ? activeData.id : null;
				console.log('Active file observer triggered:', { activeData, fileId, currentFileId });
				if (fileId !== currentFileId) {
					if (fileId) {
						console.log('Active file changed to:', fileId);
						loadFile(fileId);
					} else {
						console.log('No active file');
						currentFileId = null;
					}
				}
			};

			// Initial check
			observer();

			// Observe changes
			activeFile.observe(observer);

			return () => {
				activeFile.unobserve(observer);
			};
		}
	});

	// Reactive initialization when props are ready
	$: if (ydoc && provider && editorContainer && !view) {
		initializeEditor();
	}

	function loadFile(fileId: string) {
		console.log('Loading file:', fileId);
		const file = files.get(fileId);
		if (!file || file.type !== 'file') {
			console.warn('File not found or is not a file:', fileId);
			return;
		}

		currentFileId = fileId;

		// Get or create a Y.Text for this file
		ytext = ydoc.getText(`file-${fileId}`);

		// Initialize content if empty
		if (ytext.length === 0 && file.content !== undefined) {
			console.log('Initializing file content');
			ytext.insert(0, file.content);
		}

		// Update editor with new text
		if (view) {
			console.log('Updating editor content');
			updateEditorContent();
		}
	}

	function updateEditorContent() {
		if (!ytext || !view) return;

		const undoManager = new Y.UndoManager(ytext);

		// Create new state with the file's Y.Text
		const newState = EditorState.create({
			doc: ytext.toString(),
			extensions: [
				basicSetup,
				javascript(), // We'll use JS highlighting for now as LaTeX isn't available
				createTheme(),
				autocompletion({
					override: [latexCompletions]
				}),
				yCollab(ytext, provider.awareness, { undoManager }),
				EditorView.lineWrapping
			]
		});

		// Replace the entire state
		view.setState(newState);
	}

	function createTheme() {
		return EditorView.theme({
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
	}

	function initializeEditor() {
		console.log('Initializing CodeMirror editor...');

		if (!ydoc || !provider) {
			console.warn('Editor: ydoc or provider not ready');
			return;
		}

		// Load the active file if one is set
		const activeData = activeFile?.get('id');
		const fileId = typeof activeData === 'object' && activeData?.id ? activeData.id : null;
		if (fileId) {
			loadFile(fileId);
		} else {
			// Fallback to legacy content
			ytext = ydoc.getText('latex-content');
		}

		if (!ytext) {
			console.warn('No text to edit');
			return;
		}

		const undoManager = new Y.UndoManager(ytext);

		const state = EditorState.create({
			doc: ytext.toString(),
			extensions: [
				basicSetup,
				javascript(), // We'll use JS highlighting for now as LaTeX isn't available
				createTheme(),
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
