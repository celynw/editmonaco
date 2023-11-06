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
        // Receives a list of dicts
        // Dict keys are the same for each list element
        // Create one column for each key
        // The editor value should be a newline-separated list of values for that key
        var message = JSON.parse(event.data);
        var fields = Object.keys(message[0]);
        // Create one editor column for each field
        // TODO custom sort
        fields.forEach(function (field_name) {
            var field = document.createElement("div");
            field.id = field_name;
            document.body.appendChild(field);

            var editor = document.createElement("div");
            field.className = "editor";
            monaco.editor.create(field, {
                language: "json",
                theme: "dark-theme",
                // automaticLayout: true,
                // readOnly: true
            });
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
    };
});
