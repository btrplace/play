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

var selectedElement = null ;

function registerSelectedElement(element){
	selectedElement = element;
}


/**
 * Binds the click event on the newly drawn Nodes and VMs.
 */
function updateClickBindings(){
	$(".nodeZone, .vmZone").unbind('click').on('click',function(event){
		console.log("Click !");
		if (!canEdit) return false;

		var element ;
		if (this.className.baseVal == "nodeZone") {
			var nodeID = this.attributes["sandboxNodeID"].value;
			element = config.getNode(nodeID);
		}
		if (this.className.baseVal == "vmZone") {
			var vmID = this.attributes["sandboxVMID"].value;
			//element = config.vms[vmID];
			element = config.getVirtualMachine("VM"+vmID);
		}
       	// Safeguard
		if( typeof(element) == "undefined" ){
			console.error("Not a good click :(");
			return ;
		}
		else {
			event.stopPropagation();
		}
		console.log("Click on : ",element);
        setSelectedElement(element);
	});
}

/**
 * Set the selected element to <i>element</i>.
 * This way the element will be the target of the (relevant) keyboard actions.
 * The element will also be highlighted.
 * @param element The element (either a Node or a VM) of the Configuration to be selected.
 */
function setSelectedElement(element){
	// Unselect the previously selected element.
	if (selectedElement != null) {
		selectedElement.setSelected(false);
	}

	// Update the selectedElement global variable (for keyboard actions)
	selectedElement = element;

	// Mark the newly selected element itself as selected (for drawing purposes)
	if (element != null) {
		element.setSelected(true) ;
	}
}

// CPU_UNIT and MEM_UNIT are only tool elements, used for the validation of the keyboard action.
var CPU_UNIT = new VirtualMachine("CPU_UNIT", 1, 0),
	MEM_UNIT = new VirtualMachine("MEM_UNIT", 0, 1);

function onKeyEvent(event){
	var keyCode = event.which;

	if (!canEdit) {
		return false ;
	}
	var redraw = false ;
	if (selectedElement == null) {
		if (keyCode == 78) {
			if (config.nodes.length > 10){
				return ;
			}
			var node = new Node(config.getNextNodeID(), 3,3);
			config.nodes.push(node);
			if (LOG) console.log("Created a node !");
			redraw = true ;
		}
	}
	else if (selectedElement != null){
		redraw = true ;
		// N : New element (node or VM)
		if (keyCode == 78) {
			var node = null ;
			if (selectedElement instanceof Node) {
				node = selectedElement;
			}
			else if (selectedElement instanceof VirtualMachine){
				node = config.getHoster(selectedElement.id);
			}
			if (node != null) {
				var vm = new VirtualMachine(config.getNextVMID(), 1, 1);
					config.vms.push(vm);
				if (node.fit(vm)) {
					node.host(vm);
					drawConfiguration('canvas');
					redraw = false;
					setSelectedElement(vm);
				}
			}
		}
		// Left
		if (keyCode == 37) {
			var minSize = -1;
			if (selectedElement instanceof Node && selectedElement.fit(CPU_UNIT)){
				minSize = 3;
			}
			if (selectedElement instanceof VirtualMachine) {
				minSize = 1;
			}

			// Modify the selected element only if the new value is valid.
			if (minSize != -1 && selectedElement.cpu > minSize) {
				selectedElement.cpu--;
			}
			// Prevent the page from scrolling
			event.preventDefault();
		}
		// Right
		else if (keyCode == 39) {
			if (selectedElement instanceof Node && selectedElement.cpu < 12) {
				selectedElement.cpu++;
			}
			else if (selectedElement instanceof VirtualMachine) {
				var hoster = config.getHoster(selectedElement.id);
				if (hoster.fit(CPU_UNIT)) {
					selectedElement.cpu++;
				}
			}
			// Prevent the page from scrolling
			event.preventDefault();
		}
		// Up
		else if (keyCode == 38){
			if (selectedElement instanceof Node && selectedElement.mem < 12) {
				selectedElement.mem++;
			}
			else if (selectedElement instanceof VirtualMachine) {
				var hoster = config.getHoster(selectedElement.id);
				if (hoster.fit(MEM_UNIT)) {
					selectedElement.mem++;
				}
			}
			// Prevent the page from scrolling
			event.preventDefault();
		}
		// Down
		else if (keyCode == 40){
			var minSize = -1;
			//if ((selectedElement instanceof Node && selectedElement.canBeReduced('mem')) || selectedElement instanceof VirtualMachine) {
			if (selectedElement instanceof Node && selectedElement.fit(new VirtualMachine("test", 0, 1))) {
				minSize = 3;
			}
			if (selectedElement instanceof VirtualMachine) {
				minSize = 2;
			}
			if (minSize != -1 && selectedElement.mem > minSize) {
				selectedElement.mem--;
			}
            // Prevent the page from scrolling
			event.preventDefault();
		}
		// Escape
		else if (keyCode == 27) {
			if (selectedElement instanceof VirtualMachine) {
				var node = config.getHoster(selectedElement.id);
				setSelectedElement(node);
			}
			else {
				setSelectedElement(null);
			}
			//selectedElement.setSelected(false) ;
			//selectedElement = null ;
		}
		// Delete keys : DEL, Backspace
		else if (keyCode == 46 || keyCode == 8 || keyCode == 68) {
			var newSelectedElement = null ;
			// If it's a VM select the previous one in the node.
			if (selectedElement instanceof VirtualMachine){
				var vm = selectedElement ;
				var node = config.getHoster(vm.id),
					vmIndex = node.vms.indexOf(vm);
				vmIndex++;
				// Fix vm index
				var noOver = false;
				// If no VM over the selected one
				if (vmIndex >= node.vms.length) {
					// Target the VM before the selected one
					vmIndex -= 2 ;
					noOver = true ;
				}
				// If no VM under the selected one
				if( vmIndex < 0 ){
					// If there's also no over, select the node
					if (noOver){
						newSelectedElement = node ;
					}
					// Otherwise, select the one over :
					vmIndex+=2;
				}
				// If this is the last VM of the node, select the node
				if( node.vms.length == 1){
					newSelectedElement = node ;
				}
				// If there's still some element, get the previous
				else {
					newSelectedElement = node.vms[vmIndex];
				}
			}
			selectedElement.delete();
			if (newSelectedElement != null) {
				setSelectedElement(newSelectedElement);
			}
		}
		// V key : previous
		else if (keyCode == 86){
			shiftSelectedElement(-1);
		}
		// B key : next
		else if (keyCode == 66) {
			shiftSelectedElement(1);
		}
		// O (letter, not zero) key : Switch node state.
		else if (keyCode == 79) {
			if (selectedElement instanceof Node) {
				// A node must be empty before being turned off
				if (selectedElement.vms.length != 0 ) {
					alert("Error : a node must be empty before being turned off");
					return false;
				}
				if (LOG) console.log("Switching Node online state");
                // Switch its state
				selectedElement.online = ! selectedElement.online;

				drawConfiguration("canvas");
				setSelectedElement(null);
			}
		}
	}
	// Do a redraw
	if (redraw) {
		drawConfiguration('canvas');
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
	$("#error").html("<h4>Errors</h4>" + b);  	 			
}

// Setup keyboard actions
$(function() {
    updateClickBindings();
	$(document).keydown(function(event){
		// Do keyboard actions only if the user is not typing in the text editor.
		if( ! editor.isFocused() ){
			onKeyEvent(event);
		}
	});
});

function show(target, other) {	
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
function solve() {			
	var s = $("#solution");
	var e = $("#error");	
	var instance = instance2JSON(config, editor.getValue())
	var promise = $.ajax({
  		type: "POST",
  		//url: "http://murmuring-sierra-9341/solve",
  		url: "http://localhost:8080/solve",
  		data: JSON.stringify(instance)
  	});
  	promise.done(function (plan, statusCode) {  	  		
  		editor.getSession().setAnnotations([]);							
  		if (statusCode == "nocontent") {  			
			e.html("<p>BtrPlace stated your problem has no solution.<br/>remove or simplify some constraints</p>");
			show(e, s);
  		} else if (statusCode == "success") {
  			$("#solve").attr("disabled","disabled");
  			if (plan.actions.length == 0) {
  				s.html("<p>No need to reconfigure</p>");
  			} else {
				createPlayer(plan, "player");												
			}
			show(s, e);
  		} else {
  			console.log("Unsupported status: " + statusCode);
  		}
  	});
  	promise.fail(function (xhr) {  
  		console.log("fail with " + xhr.status);  
  		console.log(xhr.responseText);   		 		  			 	  		 
		showSyntaxErrors(JSON.parse(xhr.responseText));  	 		
		show(e, s);
	});   	 
}