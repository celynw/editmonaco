import { common_editor_config, common_global_config } from "./config.js";

var app_div = document.querySelector(".app");

require.config({ paths: { vs: "node_modules/monaco-editor/min/vs" } });
require(["vs/editor/editor.main"], function () {
	monaco.editor.defineTheme("dark-theme", {
		base: "vs-dark", // Set the base theme to "vs-dark"
		inherit: true,
		rules: [
			{ token: "", foreground: "ffffff", background: "333333" }, // Customize text and background colors
		],
		colors: {}
	});

	function json_to_content(message, fields) {
		return fields.reduce(function (result, field_name) {
			var lines = message.map(row => row[field_name]);
			result[field_name] = lines.join("\n");
			return result;
		}, {});
	}

	function editors_to_json() {
		var editors = monaco.editor.getEditors().filter(editor => editor.editor_type === "normal");
		var jsonData = editors.reduce((acc, editor) => {
			let lines = editor.getValue().split("\n");
			lines.forEach((line, index) => {
				if (!acc[index]) acc[index] = {};
				acc[index][editor.field_name] = line;
			});
			return acc;
		}, []);

		return JSON.stringify(jsonData, null);
	}

	function getParentDiffEditor(modifiedEditor) {
		return monaco.editor.getDiffEditors().find(editor => {
			return editor.getModifiedEditor() === modifiedEditor;
		});
	}

	function swap_to_diff_editor(field_name) {
		var editor = monaco.editor.getEditors().find(editor => editor.field_name === field_name && editor.editor_type === "normal");
		var mod_editor = monaco.editor.getEditors().find(editor => editor.field_name === field_name && editor.editor_type === "diff_mod");

		// Hide and show the correct editor
		editor.getContainerDomNode().style.display = "none";
		mod_editor.getContainerDomNode().parentNode.style.display = "";
		mod_editor.focus();
	}

	function swap_to_normal_editor(field_name) {
		var editor = monaco.editor.getEditors().find(editor => editor.field_name === field_name && editor.editor_type === "normal");
		var mod_editor = monaco.editor.getEditors().find(editor => editor.field_name === field_name && editor.editor_type === "diff_mod");

		// Hide and show the correct editor
		mod_editor.getContainerDomNode().parentNode.style.display = "none";
		editor.getContainerDomNode().style.display = "";
		editor.focus();
	}

	function connectWebSocket() {
		var socket = new WebSocket("ws://localhost:8336");

		socket.onopen = function () {
			console.log("Socket connected");
			socket.send("Socket connected"); // Handshake message
		};

		socket.onmessage = function (event) {
			// Expects to receive a list of dicts
			// - Each list element dict has the same keys
			// - We will create one column for each key
			// - We will join the values list with newlines and put into the editor for each column
			var message = JSON.parse(event.data);
			var fields = Object.keys(message[0]);

			fields.forEach(function (field_name) {
				// For each metadata field, create a column directly in the body
				var column_div = document.createElement("div");
				app_div.appendChild(column_div);
				column_div.id = field_name;
				column_div.style.width = 100 / (fields.length - 1) + "%";
				if (field_name === "id") {
					column_div.style.display = "none";
				}

				// Within the column, create a div for the field name
				var column_name_div = document.createElement("div");
				column_name_div.className = "column_name no-select";
				column_name_div.innerHTML = field_name;
				column_name_div.style.width = "100%";
				column_div.appendChild(column_name_div)

				// Create separate divs for the single editor and the diff editor
				var editor_div = document.createElement("div");
				editor_div.className = "column";
				editor_div.style.width = "100%";
				var diff_editor_div = document.createElement("div");
				diff_editor_div.className = "column";
				diff_editor_div.style.width = "100%";

				// Append the new divs to the column_div
				column_div.appendChild(editor_div);
				column_div.appendChild(diff_editor_div);

				// Create editors
				let editor = monaco.editor.create(editor_div, {
					...common_global_config,
					...common_editor_config,
					readOnly: field_name === "id",
				});
				editor.field_name = field_name;
				editor.editor_type = "normal";

				// Create diff editors
				let diff_editor = monaco.editor.createDiffEditor(diff_editor_div, {
					...common_global_config,
					...common_editor_config,
					renderSideBySide: true,
					useInlineViewWhenSpaceIsLimited: false,
					enableSplitViewResizing: false,
				});
				diff_editor.getOriginalEditor().field_name = field_name;
				diff_editor.getModifiedEditor().field_name = field_name;
				diff_editor.getOriginalEditor().editor_type = "diff_orig";
				diff_editor.getModifiedEditor().editor_type = "diff_mod";
			});
			// Populate the editors line-by-line
			var original_content = json_to_content(message, fields);
			monaco.editor.getEditors().forEach(function (editor, index) {
				editor.original_content = original_content[editor.field_name];
				if (editor.editor_type === "normal") {
					editor.setValue(editor.original_content);
				} else if (editor.editor_type === "diff_mod") {
					var original_model = monaco.editor.createModel(editor.original_content, "plaintext");
					var modified_model = monaco.editor.createModel(editor.original_content, "plaintext");
					var diff_editor = getParentDiffEditor(editor);
					diff_editor.setModel({ original: original_model, modified: modified_model });
				}

			});

			// Editor callbacks
			// Includes normal editors, original/modified editors of diff editors, but not the diff editors themselves
			monaco.editor.getEditors().forEach(function (editor, index) {
				// Synchronise line changes
				editor.onDidChangeCursorPosition(function (e) {
					monaco.editor.getEditors().forEach(function (otherEditor, otherIndex) {
						// source could be "mouse", "keyboard", "api", "model"
						if (otherEditor !== editor && e.source !== "api" && e.source !== "model") {
							if (otherEditor.field_name !== editor.field_name) {
								// Between columns, the content likely differs, so only set the line number
								otherEditor.setPosition({ lineNumber: e.position.lineNumber, column: 1 });
							} else {
								// Between normal/diff editors, the content should be the same, so use the full position
								otherEditor.setPosition(e.position);
							}
						}
					});
				});
				// Synchronise scrolling
				editor.onDidScrollChange(function (e) {
					monaco.editor.getEditors().forEach(function (otherEditor, otherIndex) {
						// There is no e.source for scroll events, but it should be OK without filtering that
						if (otherEditor !== editor) {
							otherEditor.setScrollTop(e.scrollTop);
						}
					});
				});
				// Catch changed content
				if (editor.editor_type === "normal") {
					editor.onDidChangeModelContent(function (e) {
						// https://github.com/microsoft/monaco-editor/issues/432#issuecomment-749198333
						if (!e.isFlush) {
							var mod_editor = monaco.editor.getEditors().find(other_editor => other_editor.field_name === editor.field_name && other_editor.editor_type === "diff_mod");
							var diff_editor = getParentDiffEditor(mod_editor);
							var model = diff_editor.getModel()
							model.modified.setValue(editor.getValue());
							diff_editor.setModel(model);
							// Shouldn't need to set position: Impossible to change content without a position change
							if (editor.getValue() !== editor.original_content) {
								swap_to_diff_editor(editor.field_name);
							}
						}
					});
				} else if (editor.editor_type === "diff_mod") {
					editor.onDidChangeModelContent(function (e) {
						// https://github.com/microsoft/monaco-editor/issues/432#issuecomment-749198333
						if (!e.isFlush) {
							var normal_editor = monaco.editor.getEditors().find(other_editor => other_editor.field_name === editor.field_name && other_editor.editor_type === "normal");
							normal_editor.setValue(editor.getValue());
							// onDidChangeCursorPosition is not enough: content can change without a position change
							normal_editor.setPosition(editor.getPosition());
							if (editor.getValue() === editor.original_content) {
								swap_to_normal_editor(editor.field_name);
							}
						}
					});
				}
			});

			document.querySelector(".button.submit").addEventListener("click", function () {
				socket.send(editors_to_json());
			});
		};

		socket.onclose = function (event) {
			console.log("Socket closed, attempting to reconnect...");
			setTimeout(function () {
				connectWebSocket();
			}, 1000);
		};
	}

	connectWebSocket();
});
