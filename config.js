// https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IGlobalEditorOptions.html
export const global_editor_config = {
	autoDetectHighContrast: true,
	detectIndentation: false,
	insertSpaces: true,
	largeFileOptimizations: true,
	maxTokenizationLineLength: 0,
	semanticHighlighting: {
		enabled: false,
	},
	stablePeek: false,
	tabSize: 4,
	theme: "dark-theme",
	trimAutoWhitespace: true,
	wordBasedSuggestions: "allDocuments",
	wordBasedSuggestionsOnlySameLanguage: false,
}

// https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IEditorOptions.html
export const editor_config = {
	acceptSuggestionOnCommitCharacter: false,
	acceptSuggestionOnEnter: "off",
	autoClosingBrackets: "always",
	autoClosingComments: "never",
	autoClosingDelete: "always",
	autoClosingOvertype: "always",
	autoClosingQuotes: "always",
	autoIndent: "none",
	autoSurround: "languageDefined",
	automaticLayout: true,
	bracketPairColorization: {
		enabled: true,
		independentColorPoolPerBracketType: false,
	},
	codeLens: false,
	colorDecorators: false,
	columnSelection: true,
	contextmenu: true,
	copyWithSyntaxHighlighting: true,
	// https://github.com/microsoft/vscode/issues/168857#issuecomment-1350754858
	cursorSmoothCaretAnimation: "on",
	cursorStyle: "line",
	cursorSurroundingLines: 3,
	cursorSurroundingLinesStyle: "default",
	defaultColorDecorators: true,
	dragAndDrop: false,
	dropIntoEditor: false,
	emptySelectionClipboard: false,
	find: {
		addExtraSpaceOnTop: false,
		autoFindInSelection: "always",
		cursorMoveOnType: false,
		diff: true,
		seedSearchStringFromSelection: "selection",
	},
	folding: false,
	foldingImportsByDefault: false,
	fontLigatures: false,
	formatOnPaste: false,
	formatOnType: false,
	glyphMargin: false,
	guides: {
		bracketPairs: false,
		bracketPairsHorizontal: "active",
		highlightActiveBracketPair: true,
		highlightActiveIndentation: false,
		indentation: false,
	},
	hover: {
		enabled: false,
	},
	inlayHints: {
		enabled: "off",
	},
	inlineSuggest: {
		enabled: false,
	},
	language: "plaintext",
	lightbulb: {
		enabled: "off",
	},
	lineDecorationsWidth: 6, // If zero, line numbers are too close to the text
	lineNumbersMinChars: 2,
	links: true,
	matchBrackets: "always",
	matchOnWordStartOnly: false,
	minimap: {
		autohide: false,
		enabled: true,
		renderCharacters: true,
		showMarkSectionHeaders: false,
		showRegionSectionHeaders: false,
		// showSlider: "mouseover",
		showSlider: "always",
		side: "right",
		// size: "proportional",
		// size: "fill",
		size: "fit",
	},
	mouseStyle: "text",
	mouseWheelZoom: false,
	multiCursorMergeOverlapping: true,
	multiCursorModifier: "ctrlCmd",
	multiCursorPaste: "spread",
	occurrencesHighlight: "multiFile",
	overviewRulerBorder: false,
	overviewRulerLanes: 1,
	pasteAs: {
		enabled: false,
	},
	padding: {
		top: 0,
		bottom: 0,
	},
	parameterHints: {
		enabled: false,
	},
	quickSuggestions: {
		strings: true,
		comments: true,
		other: true,
	},
	renderControlCharacters: true,
	renderFinalNewline: "on",
	renderLineHighlight: "all",
	renderLineHighlightOnlyWhenFocus: false,
	renderValidationDecorations: "off",
	renderWhitespace: "selection",
	roundedSelection: true,
	rulers: [],
	scrollBeyondLastLine: true,
	scrollPredominantAxis: true,
	scrollbar: {
		alwaysConsumeMouseWheel: true,
		handleMouseWheel: true,
		horizontal: "auto",
		useShadows: true,
		vertical: "hidden",
	},
	selectOnLineNumbers: true,
	selectionClipboard: true,
	selectionHighlight: true,
	showDeprecated: false,
	showFoldingControls: "never",
	showUnused: false,
	smartSelect: {
		selectLeadingAndTrailingWhitespace: true,
		selectSubwords: true,
	},
	smoothScrolling: false,
	snippetSuggestions: "none",
	stickyScroll: false,
	stickyTabStops: false,
	suggest: {
		filterGraceful: true,
		insertMode: "insert",
		localityBonus: false,
		matchOnWordStartOnly: true,
		preview: true,
		previewMode: "subwordSmart",
		selectionMode: "always",
		shareSuggestSelections: true,
		showClasses: false,
		showColors: false,
		showConstants: false,
		showConstructors: false,
		showDeprecated: false,
		showEnumMembers: false,
		showEnums: false,
		showEvents: false,
		showFields: false,
		showFiles: false,
		showFolders: false,
		showFunctions: false,
		showIcons: true,
		showInlineDetails: true,
		showInterfaces: false,
		showIssues: false,
		showKeywords: false,
		showMethods: false,
		showModules: false,
		showModules: false,
		showOperators: false,
		showProperties: false,
		showReferences: false,
		showSnippets: false,
		showStatusBar: false,
		showStructs: false,
		showTypeParameters: false,
		showUnits: false,
		showUsers: false,
		showValues: true,
		showVariables: false,
		showWords: true,
		snippetsPreventQuickSuggestions: false,
	},
	suggestSelection: "first",
	tabCompletion: true,
	tabFocusMode: true,
	unicodeHighlight: {
		includeStrings: true,
		invisibleCharacters: true,
	},
	unusualLineTerminators: "auto",
	useShadowDOM: false,
	useTabStops: false,
	wordWrap: "off",
	wrappingIndent: "indent",
}

// https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IDiffEditorOptions.html
export const diff_editor_config = {
	diffAlgorithm: "classic",
	diffCodeLens: false,
	diffWordWrap: "off",
	enableSplitViewResizing: true,
	hideUnchangedRegions: {
		enabled: false,
	},
	ignoreTrimWhitespace: false,
	originalEditable: false,
	renderGutterMenu: false,
	renderIndicators: false,
	renderMarginRevertIcon: true,
	renderOverviewRuler: true,
	renderSideBySide: true,
	splitViewDefaultRatio: 0.5,
	useInlineViewWhenSpaceIsLimited: false,
}

export const editor_keybinds = [];

require.config({ paths: { vs: "node_modules/monaco-editor/min/vs" } });
require(["vs/editor/editor.main"], function () {
	// Check the default keybindings by running:
	// console.log(editor._standaloneKeybindingService._getResolver()._defaultKeybindings);

	// Keycodes here:
	// https://microsoft.github.io/monaco-editor/typedoc/classes/KeyMod.html
	// https://microsoft.github.io/monaco-editor/typedoc/enums/KeyCode.html
	const disabled_keybinds = [
		monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.UpArrow, // cursorUpSelect
		monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow, // cursorDownSelect
		monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Home, // cursorTopSelect
		monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.End, // cursorBottomSelect
		monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, // editor.action.copyLinesUpAction
		monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, // editor.action.copyLinesDownAction
		monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, // editor.action.deleteLines
		monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, // expandLineSelection
		monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketRight, // editor.action.indentLines
		monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketLeft, // editor.action.outdentLines
		monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, // editor.action.insertLineAfter
		monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, // editor.action.insertLineBefore
		monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, // editor.action.selectAll
		monaco.KeyMod.Shift | monaco.KeyCode.Tab, // outdent
		monaco.KeyCode.Tab, // tab
		monaco.KeyCode.F7, // editor.action.accessibleDiffViewer.next
		monaco.KeyMod.Shift | monaco.KeyCode.F7, // editor.action.accessibleDiffViewer.prev
		monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.RightArrow, // editor.action.smartSelect.expand
		monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.LeftArrow, // editor.action.smartSelect.shrink
	]

	// TODO these can still be called from the F1 menu
	disabled_keybinds.forEach(keybind => {
		editor_keybinds.push({
			keybinding: keybind,
			command: null,
		});
	});
});
