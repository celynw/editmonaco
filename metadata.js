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

    var socket = new WebSocket("ws://localhost:8889");
    socket.onopen = function () {
        // alert("Socket connected!");
        socket.send("Message from web interface!");
    };
    socket.onmessage = function (event) {
        try {
            // Receives a list of dicts
            // Dict keys are the same for each list element
            // Create one column for each key
            // The editor value should be a newline-separated list of values for that key
            var message = JSON.parse(event.data);
            var fields = Object.keys(message[0]);
            var editors = []; // To be populated in onmessage
            // Create one editor column for each field
            // TODO custom sort, I believe the current sort is based on field order in beets.library.Item
            fields.forEach(function (field_name) {
                var field = document.createElement("div");
                field.id = field_name;
                field.className = "field";
                field.style.width = 100 / fields.length + "%";
                document.body.appendChild(field);

                var column_name = document.createElement("div");
                column_name.className = "column_name";
                column_name.innerHTML = field_name;
                field.appendChild(column_name)

                var editor = document.createElement("div");
                editors.push(
                    monaco.editor.create(field, {
                        language: "json",
                        theme: "dark-theme",
                        // automaticLayout: true,
                        // readOnly: true
                    })
                );
                field.appendChild(editor)
            });

            // Populate the editors line-by-line
            Object.entries(fields).forEach(function ([field_name, field_data]) {
                var editor = monaco.editor.getModels()[field_name];
                var lines = [];
                // Append this editor with field_data
                message.forEach(function (row) {
                    lines.push(row[field_data]);
                });
                editor.setValue(lines.join("\n")); // TODO call once at the end instead
            });

            // Synchronise lines
            socket.send(editors);
            editors.forEach(function (editor, index) {
                editor.onDidChangeCursorPosition(function (e) {
                    var newLineNumber = e.position.lineNumber;
                    socket.send("Line changed to " + newLineNumber);
                    editors.forEach(function (otherEditor, otherIndex) {
                        if (otherIndex !== index) {
                            otherEditor.setPosition({ lineNumber: newLineNumber, column: 1 });
                        }
                    });
                });
            });
        } catch (error) {
            socket.send(error.message);
        };
    };
});
