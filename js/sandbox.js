/*
 * Main functions used by the Sandbox.
 * This does not include function for diagram generation and animation.
 * @author Tom Guillermin
 */
var LOG = false ;
var currentView = "";
// If this variable is set to false, the check() function will not be able to be executed.
var canSubmit = true ;
var canEdit = true ;

var endPoint = "http://murmuring-sierra-9341.herokuapp.com";
//var endPoint = "http://localhost:8080";
var selectedElement = null ;
var current;

var KEY_N = 78;
var KEY_O = 79;
var KEY_D = 68;
var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_LEFT = 37;
var KEY_RIGHT = 39;

var backupConfig = undefined;
/**
 * Click to de-select by default
 */
$(document).ready(function(){
    $(document).click(function(){
        setSelectedElement(null);
    });
});

/**
 * Set the selected element to <i>element</i>.
 * This way the element will be the target of the (relevant) keyboard actions.
 * The element will also be highlighted.
 * @param element The element (either a Node or a VM) of the Configuration to be selected.
 */
function setSelectedElement(element){	
	if (!canEdit)  {
		return false;
	}
	// Unselect the previously selected element.
	if (selectedElement != null) {		
		selectedElement.unSelect();
	}

	// Update the selectedElement global variable (for keyboard actions)
	selectedElement = element;

	// Mark the newly selected element itself as selected (for drawing purposes)
	if (element != null) {		
		element.select();
	}
}

function setReadOnly(b) {	
	canEdit = !b;
	editor.setReadOnly(b);
	if (!b) {
		backupConfig = undefined;
		$("#editor").find(".ace_content").removeClass("lock");
		$("#canvas").removeClass("lock");
	} else {
		$("#editor").find(".ace_content").addClass("lock");
		$("#canvas").addClass("lock");
	}
}

function onKeyEvent(event){
	var keyCode = event.which;
	if (!canEdit) {
		return false;
	}
	if (selectedElement != null) {	
		selectedElement.onKeyEvent(keyCode);
	} else {
		config.onKeyEvent(keyCode);
	}
}

/**
 * Annotates the lines with syntax errors in the constraints script.
 */
function showSyntaxErrors(errors) {	
    var anns = [];    
    var b = "<ul>";
    errors.forEach(function (err) {    	
		anns.push({
			row: err.ln - 1,
            column: err.cn,
            type: "error",
            text:err.message            
        });
        b = b + "<li>line " + err.ln + ", column " + err.cn + ": " + err.message + "</li>";
    });
    b += "</ul>";        
    editor.getSession().setAnnotations(anns)    
	$("#error-cnt").html("<h4>Errors</h4>" + b);  	 			
}

// Setup keyboard actions
$(function() {
	$(document).keydown(function(event){
		// Do keyboard actions only if the user is not typing in the text editor.
		if( ! editor.isFocused() ){
			onKeyEvent(event);
		}
	});
});

function show(target, other) {	
	setReadOnly(target.attr('id') == "solution")
	if (other.is(":visible")) {		
		other.hide("slide", {direction: "down", complete: function (){
			target.show("slide", {direction: "down"}, 200);
		}}, 200);
	} else {
		if (!target.is(":visible")) {			
			target.show("slide", {direction: "down"}, 200);
		}
	}
}

function hide() {	
	setReadOnly(false);
	var args = Array.prototype.slice.call(arguments);
	args.forEach(function (id) {
		var d = $("#" + id);
		if (d.is(":visible")) {
			d.hide("slide", {direction: "down"}, 200);		
		}		
	});
}
function solve() {		
	var s = $("#solution");
	var e = $("#error");	
	if (backupConfig) {
		config = backupConfig;
	}	
	var instance = instance2JSON(config, editor.getValue())
	var promise = $.ajax({
  		type: "POST",  		
  		url: endPoint + "/solve",
  		data: JSON.stringify(instance)
  	});
  	promise.done(function (plan, statusCode) {  	  		
  		editor.getSession().setAnnotations([]);							
  		if (statusCode == "nocontent") {  			
			$("#error-cnt").html("<p>BtrPlace stated your problem has no solution.<br/>remove or simplify some constraints</p>");
			show(e, s);
  		} else if (statusCode == "success") {
  			setReadOnly(true);
  			backupConfig = JSON2Model(plan.origin);  			
  			if (plan.actions.length == 0) {
  				$("#player").html("<p>No need to reconfigure</p>");
  			} else {
				createPlayer(plan, "player");												
			}			
			show(s, e);
  		} else {
  			console.log("Unsupported status: " + statusCode);
  		}
  	});
  	promise.fail(function (xhr) {   		
		if (xhr.status == 400) {
  			showSyntaxErrors(JSON.parse(xhr.responseText));  	 			
  		} else {
  			$("#error-cnt").html("<p>" + xhr.responseText + "</p>");
  		}  		
		show(e, s);
	});   	 
}