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

	function connectWebSocket() {
		var socket = new WebSocket("ws://localhost:8889");

		socket.onopen = function () {
			console.log("Socket connected");
			socket.send("Socket connected"); // Handshake message
		};

		socket.onmessage = function (event) {
			try {
				// Expects to receive a list of dicts
				// - Each list element dict has the same keys
				// - We will create one column for each key
				// - We will join the values list with newlines and put into the editor for each column
				var message = JSON.parse(event.data);
				fields = Object.keys(message[0]);
				var editors = [];

				fields.forEach(function (field_name) {
					// For each metadata field, create a column and put directly into the body
					var column_div = document.createElement("div");
					column_div.id = field_name;
					column_div.className = "column";
					column_div.style.width = 100 / (fields.length - 1) + "%";
					if (field_name === "id") {
						column_div.style.display = "none";
					}
					document.body.appendChild(column_div);

					// Within the column, create a div for the field name
					var column_name = document.createElement("div");
					column_name.className = "column_name no-select";
					column_name.innerHTML = field_name;
					column_div.appendChild(column_name)

					// Within the column, editor divs (appended automatically)
					editors.push(
						monaco.editor.create(column_div, {
							language: "plaintext",
							theme: "dark-theme",
							// automaticLayout: true,
							readOnly: field_name === "id",
						})
					);
				});

				// Populate the editors line-by-line
				json_to_editors(editors, message);

				// Synchronise lines
				editors.forEach(function (editor, index) {
					editor.onDidChangeCursorPosition(function (e) {
						if (e.source === "api") {
							editor.setPosition({ lineNumber: e.position.lineNumber, column: e.position.column });
						} else {
							editors.forEach(function (otherEditor, otherIndex) {
								if (otherIndex !== index) {
									otherEditor.setPosition({ lineNumber: e.position.lineNumber, column: 1 });
								}
							});
						}
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

		socket.onclose = function (event) {
			console.log("Socket closed, attempting to reconnect...");
			setTimeout(function () {
				connectWebSocket();
			}, 1000);
		};
	}

	connectWebSocket();
});
