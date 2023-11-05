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
        // All messages will be JSON
        var message = JSON.parse(event.data);
        // alert(JSON.stringify(message));

        // If message keys is [fields], set up editors
        if (message.fields) {
            var editors = {};
            // Set up one editor for each string in "fields"
            message.fields.forEach(function (field) {
                var div = document.createElement("div");
                div.className = "editor";
                div.id = field;
                document.body.appendChild(div);

                var editor = monaco.editor.create(document.getElementById(field), {
                    value: field, // TODO populate
                    language: "json",
                    theme: "dark-theme",
                });
                editors[field] = editor;
            });
        }
    };
});
