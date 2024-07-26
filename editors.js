export function json_to_content(message, fields) {
	return fields.reduce(function (result, field_name) {
		var lines = message.map(row => row[field_name]);
		result[field_name] = lines.join("\n");
		return result;
	}, {});
}

export function editors_to_json() {
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

export function getParentDiffEditor(modifiedEditor) {
	return monaco.editor.getDiffEditors().find(editor => {
		return editor.getModifiedEditor() === modifiedEditor;
	});
}

export function swap_to_diff_editor(field_name) {
	var editor = monaco.editor.getEditors().find(editor => editor.field_name === field_name && editor.editor_type === "normal");
	var mod_editor = monaco.editor.getEditors().find(editor => editor.field_name === field_name && editor.editor_type === "diff_mod");

	// Hide and show the correct editor
	editor.getContainerDomNode().style.display = "none";
	mod_editor.getContainerDomNode().parentNode.style.display = "";
	mod_editor.focus();
}

export function swap_to_normal_editor(field_name) {
	var editor = monaco.editor.getEditors().find(editor => editor.field_name === field_name && editor.editor_type === "normal");
	var mod_editor = monaco.editor.getEditors().find(editor => editor.field_name === field_name && editor.editor_type === "diff_mod");

	// Hide and show the correct editor
	mod_editor.getContainerDomNode().parentNode.style.display = "none";
	editor.getContainerDomNode().style.display = "";
	editor.focus();
}
