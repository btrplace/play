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

var plan;


function favorites() {
	return $.get(endPoint + "/store");
}


function displayFavorites(ucs) {
	var useCase = getURLParameter("uc");
	var buf = "";
	ucs.forEach(function (uc) {
		buf += "<option value='" + uc.key + "'>" + uc.title + "</option>";
	});
	buf += "<option value='_' class='rnd'>random ...</option>";
	$("option").replaceWith(buf);	
    if (useCase != undefined) {	
    	loadUseCase(useCase);
    } else {        
    	loadUseCase($("option:first").attr("value"));
    }
}
/**
 * Click to de-select by default
 */
$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip()
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
		$("#editor").find(".ace_content").removeClass("lock");
		$("#canvas").removeAttr("class");
	} else {
		$("#editor").find(".ace_content").addClass("lock");
		$("#canvas").attr("class","lock");
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
	plan = undefined;
	var args = Array.prototype.slice.call(arguments);
	args.forEach(function (id) {
		var d = $("#" + id);
		if (d.is(":visible")) {
			d.hide("slide", {direction: "down"}, 200);
		}
	});
}
function solve() {
	var instance = instance2JSON(config, editor.getValue())
	if (plan) {
		config = JSON2Model(plan.origin);
		drawConfiguration("canvas");
		instance.model = plan.origin;
	}
	var promise = $.ajax({
  		type: "POST",
  		url: endPoint + "/solve",
  		data: JSON.stringify(instance)
  	});
	var s = $("#solution");
	var e = $("#error");
	hide("solution", "error");
  	promise.done(function (p, statusCode) {
  		plan = p;
  		editor.getSession().setAnnotations([]);
  		if (statusCode == "nocontent") {
			$("#error-cnt").html("<p>BtrPlace stated your problem has no solution.<br/>remove or simplify some constraints</p>");
			show(e, s);
  		} else if (statusCode == "success") {
  			setReadOnly(true);
  			config = JSON2Model(plan.origin);
  			drawConfiguration("canvas");
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
		if (xhr.status == 406) {
  			showSyntaxErrors(JSON.parse(xhr.responseText));
  		} else {
  			$("#error-cnt").html("<p>" + xhr.responseText + "</p>");
  		}
		show(e, s);
	});
}