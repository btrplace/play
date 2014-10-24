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
    var useCase = getURLParameter("uc");
    editor = ace.edit("editor");
    editor.setHighlightActiveLine(false);
    editor.setHighlightGutterLine(false);
    if (useCase != undefined) {
    	loadUseCase(useCase);
    } else {        
    	loadUseCase($("option:first").attr("value"));
    }
}