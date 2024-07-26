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

	function json_to_editors(editors, message, fields) {
		fields.forEach(function (field_name, index) {
			var editor = editors[index];
			var lines = message.map(row => row[field_name]);
			editor.setValue(lines.join("\n"));
		});
	}

	function editors_to_json(editors) {
		var editorsData = editors.map(editor => editor.getValue());
		console.log(editorsData);

		// Assume all editors have the same number of lines
		let lineCount = editorsData[0].split("\n").length;
		let jsonData = [];
		for (let i = 0; i < lineCount; i++) {
			let row = {};
			editorsData.forEach((editorContent, index) => {
				let lines = editorContent.split("\n");
				row[fields[index]] = lines[i] || ""; // Use an empty string if the line does not exist
			});
			jsonData.push(row);
		}

		return JSON.stringify(jsonData, null);
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
			var editors = [];

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

				// Create separate divs for the editor
				var editor_div = document.createElement("div");
				editor_div.className = "column";
				editor_div.style.width = "100%";

				// Append the new divs to the column_div
				column_div.appendChild(editor_div);

				// Within the column, editor divs (appended automatically)
				editors.push(
					monaco.editor.create(editor_div, {
						language: "plaintext",
						theme: "dark-theme",
						// automaticLayout: true,
						readOnly: field_name === "id",
						scrollbar: {
							vertical: "hidden",
							horizontal: "hidden",
						},
						minimap: {
							enabled: false,
						},
						lineNumbersMinChars: 0,
					})
				);
			});

			// Populate the editors line-by-line
			json_to_editors(editors, message, fields);

			// Editor callbacks
			monaco.editor.getEditors().forEach(function (editor, index) {
				// Synchronise line changes
				editor.onDidChangeCursorPosition(function (e) {
					monaco.editor.getEditors().forEach(function (otherEditor, otherIndex) {
						if (otherEditor !== editor && e.source !== "api") {
							otherEditor.setPosition({ lineNumber: e.position.lineNumber, column: 1 });
						}
					});
				});
				// Synchronise scrolling
				editor.onDidScrollChange(function (e) {
					monaco.editor.getEditors().forEach(function (otherEditor, otherIndex) {
						// There is no e.source for scroll events, but it should be OK
						if (otherEditor !== editor) {
							otherEditor.setScrollTop(e.scrollTop);
						}
					});
				});
			});

			document.querySelector(".button.submit").addEventListener("click", function () {
				socket.send(editors_to_json(editors));
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
