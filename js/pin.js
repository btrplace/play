//Check for an id
var editor;

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

function error(msg) {
    $("#error-msg").html(msg);
    $("#modal-error").modal('toggle');
}
function init() {
    editor = ace.edit("editor");
    editor.setHighlightActiveLine(false);
    editor.setHighlightGutterLine(false);

    // Load the favorites
    favorites().done(displayFavorites).fail(function() {debugger})
}