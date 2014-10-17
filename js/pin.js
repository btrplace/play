//Check for an id
var editor;

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

function error(msg) {
    $("#error-msg").html(msg);    
    $("#modal").modal('toggle');
}

function init() {        
    var useCase = getURLParameter("uc");        
    editor = ace.edit("editor");
    editor.setReadOnly(true);               
    loadUseCases("use-cases", useCase);    
}