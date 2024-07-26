import { connectWebSocket } from "./websocket.js";

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

	connectWebSocket();
});
