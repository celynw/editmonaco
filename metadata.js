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
        value: "Editor 1: Your code here",
        language: "javascript",
        theme: "dark-theme" // Apply the dark theme
    });

    var editor2 = monaco.editor.create(document.getElementById("editor2"), {
        value: "Editor 2: Your code here",
        language: "javascript",
        theme: "dark-theme" // Apply the dark theme
    });

    var editor3 = monaco.editor.create(document.getElementById("editor3"), {
        value: "Editor 3: Your code here",
        language: "javascript",
        theme: "dark-theme" // Apply the dark theme
    });
});
