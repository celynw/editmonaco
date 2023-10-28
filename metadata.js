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

    var editor1 = monaco.editor.create(document.getElementById("editor1"), {
        value: "",
        language: "javascript",
        theme: "dark-theme" // Apply the dark theme
    });

    var editor2 = monaco.editor.create(document.getElementById("editor2"), {
        value: "",
        language: "javascript",
        theme: "dark-theme" // Apply the dark theme
    });

    var editor3 = monaco.editor.create(document.getElementById("editor3"), {
        value: "",
        language: "javascript",
        theme: "dark-theme" // Apply the dark theme
    });

    var socket = new WebSocket("ws://localhost:8889");
    socket.onopen = function () {
        alert("Socket connected!");
        socket.send("Message from web interface!");
    };
    socket.onmessage = function (event) {
        // When a message is received, update the content of the first editor
        editor1.setValue(event.data);
    };
});
