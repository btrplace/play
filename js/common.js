function moveCaretToStart(el) {
    if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = 0;
    } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(true);
        range.select();
    }
}

function getConsecutiveObject(arr, obj, direction){
	var objIndex = arr.indexOf(obj);
	objIndex += direction;
	// Backward safeguard
	if (objIndex < 0) {
		objIndex = arr.length + objIndex;
	}
	// Forward safeguard
	objIndex %= arr.length;

	return arr[objIndex];
}
