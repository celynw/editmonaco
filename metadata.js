var fields = []; // Dynamically set based on the data received from beets

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

	function json_to_editors(editors, message) {
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

	var socket = new WebSocket("ws://localhost:8889");
	socket.onopen = function () {
		socket.send("Socket connected");
	};
	socket.onmessage = function (event) {
		try {
			// Receives a list of dicts
			// Dict keys are the same for each list element
			// Create one column for each key
			// The editor value should be a newline-separated list of values for that key
			var message = JSON.parse(event.data);
			fields = Object.keys(message[0]);
			var editors = []; // To be populated in onmessage
			// Create one editor column for each field
			fields.forEach(function (field_name) {
				var field = document.createElement("div");
				field.id = field_name;
				field.className = "field";
				field.style.width = 100 / (fields.length - 1) + "%";
				if (field_name === "id") {
					field.style.display = "none";
				}
				document.body.appendChild(field);

				var column_name = document.createElement("div");
				column_name.className = "column_name no-select";
				column_name.innerHTML = field_name;
				field.appendChild(column_name)

				var editor = document.createElement("div");
				editors.push(
					monaco.editor.create(field, {
						language: "plaintext",
						theme: "dark-theme",
						// automaticLayout: true,
						readOnly: field_name === "id",
					})
				);
				field.appendChild(editor)
			});

			// Populate the editors line-by-line
			json_to_editors(editors, message);

			// Synchronise lines
			editors.forEach(function (editor, index) {
				editor.onDidChangeCursorPosition(function (e) {
					var newLineNumber = e.position.lineNumber;
					editors.forEach(function (otherEditor, otherIndex) {
						if (otherIndex !== index) {
							otherEditor.setPosition({ lineNumber: newLineNumber, column: 1 });
						}
					});
				});
			});

			// Synchronise scrolling
			editors.forEach(function (editor, index) {
				editor.onDidScrollChange(function (e) {
					var newScrollTop = e.scrollTop;
					editors.forEach(function (otherEditor, otherIndex) {
						if (otherIndex !== index) {
							otherEditor.setScrollTop(newScrollTop);
						}
					});
				});
			});
		} catch (error) {
			socket.send(error.message);
		};

		document.querySelector(".button.submit").addEventListener("click", function () {
			socket.send(editors_to_json(editors));
		});
	};
});
