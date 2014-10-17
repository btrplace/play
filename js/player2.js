var paused = true;

var schedule;

var now;
var unit = 140;
var SPEED = 1000;
function makeSpan(actions) {
	var h = 0;
	actions.forEach(function (a) {
		if (a.end > h) {
			h = a.end;
		}
	});
	return h;
}

function makeAction(unit, lbl, start, end, h){
    var actionBar = $("<div></div>").addClass("actionBar"),
		actionLine = $("<div></div>").addClass("actionLine"),
    	actionContainer = $("<div></div>").addClass("actionContainer");
	actionBar.html(lbl);
	actionContainer.append(actionBar).appen
	actionContainer.append(actionLine);

	//+1 to make a space from the left border
	actionBar.css({left: (start + 1) * unit, width: (end - start) * unit});	
	return actionContainer;
}

function makeTimeline(unit, h) {
	var timeline = $("<div></div>").addClass("graduations");
	timeline.append($("<div></div>").addClass("actionLine"));
	for (var i = 0; i <= h; i++) {
		var x = (i + 1) * unit;
		var g = $("<div></div>").addClass("timestamp");			
		var m = $("<div>" + i + "</div>").addClass("timemark");			
		g.css({left:x});		
		m.css({left:x});	
		timeline.append(g).append(m);				
	}	

	return timeline;
}

function label(vmNs, nodeNs, a) {
	switch (a.id) {
		case "migrateVM": return "migrate " + name(vmNs, a.vm) + " to " + name(nodeNs, a.to);
		case "bootNode": return "boot " + name(nodeNs, a.node);
		case "shutdownNode": return "shutdown " + name(nodeNs, a.node);
		default: console.log("Unsupported action: " + a.id);
	}
}

function name(ns, id) {
	var name = undefined;
	Object.keys(ns.map).forEach(function(k) {
		if (ns.map[k] == id) {
			if (ns.type == "vm") {
				name = k.substring(k.indexOf(".") + 1);
			} else {
				name = k;
			}	
			return true;
		}
	});
	return name;
}

function createPlayer(plan, to) {
	var vmNs = undefined;
	var nodeNs = undefined;
	plan.origin.views.forEach(function (view) {
		if (view.id == "ns") {
			if (view.type == "vm") { vmNs = view}
			else if (view.type == "node") {nodeNs = view;}
		}				
	});
	var div = $("#"+to);
	div.html("");	
	var h = makeSpan(plan.actions);	
	var actions = $("<div></div>").addClass("actionLines"); 
	plan.actions.forEach(function (a) {
		var lbl = label(vmNs, nodeNs, a);
		actions.append(makeAction(unit, lbl, a.start, a.end, h));		
	});
		var controler = "<div class='controler'>"
		+ "<a class='btn btn-default btn-green' onclick='rwd()'><i class='fa fa-fast-backward'></i></a>"		
		+ "<a class='btn btn-default btn-green' onclick='playPause(this)'><i class='fa fa-play'></i></a>"		
		+ "<a class='btn btn-default btn-green' onclick='ffwd()'><i class='fa fa-fast-forward'></i></a>"
		+ "</div>";
	div.append(controler);				
	div.append(actions);
	div.append(makeTimeline(unit,h));		
	var cursor = $("<div></div>").addClass("cursor").css("left", unit);
	cursor.append($("<div>&diamondsuit;</div>").addClass("time-mark"));
	actions.append(cursor);
	div.append();
	schedule = prepareReconfiguration(plan.actions, h);
	now = 0;
	paused = true;
}

function ffwd() {
	$("#player").find(".btn-green").disable();
	paused = false;
	run(now, 3);
}

function playPause(btn) {
	paused = !paused;
	var icon = $(btn).find("i");
	if (icon.hasClass("fa-play")) {
		icon.removeClass("fa-play");
		icon.addClass("fa-pause");	
		console.log("Let's run from " + now);	
		run(now, 1);

	} else {
		icon.removeClass("fa-pause");
		icon.addClass("fa-play");		
		console.log("Paused at " + now)	;
	}	
}

function animateCursor(acc, step) {
	var to = (now + step) * unit;	
	var d = $.Deferred();
	var duration = SPEED * acc;
	$(".cursor").animate({left: to + "px"}, duration, "linear")
	setTimeout(function() {
  		d.resolve();
 	}, duration);
 	return d.promise();
}

function run(n, speed) {
	if (paused) {
		return;
	}
	now = n + 1;
	console.log("run time " + n);
	var deferreds = [];
	schedule[n].forEach(function (a) {
		deferreds.push(apply(a, speed));		
	})
	//the cursor
	deferreds.push(animateCursor(1,1));
	$.when.apply($, deferreds).then(
		function () {
			console.log("Group done");
			if (!paused) {
				if (now < schedule.length) {
				run (now);
				} else {
					console.log("Over");
				}
			} else {
				console.log("now paused");
			}

		}
		);
}

function apply(a, speed) {	
	var d = $.Deferred();
	var duration = (a.end - a.start) * (speed * 1000);
	if (a.id == "bootNode") {
		bootNode(config.nodes[a.node], duration)
	} else if (a.id == "shutdownNode") {					
		shutdownNode(config.nodes[a.node], duration);
	} else if (a.id == "migrateVM") {	
		migrate(config.vms[a.vm], config.nodes[a.from], config.nodes[a.to], duration);
	} else {
		console.log("Unsupported action " + a.id);
	}
	setTimeout(function() {
		console.log("Done " + JSON.stringify(a));
  		d.resolve();
 	}, duration);
 	return d.promise();
}

function prepareReconfiguration(actions, h) {
	var groups = [];
	for(var i = 0; i < h; i++) {
		groups[i] = [];
	}
	actions.forEach(function (a) {
		groups[a.start].push(a);
	})	
	return groups;
}

//Animation for booting a node
function bootNode(node, duration) {
	console.log("booting " + node.id);	
    node.boxStroke.animate({'stroke': 'black'}, duration,"<>", function() {node.online = true;});
    node.boxFill.animate({'fill': 'black'}, duration,"<>", function() {});
}

// Animation for shutting down a node
function shutdownNode(node, duration){	
	console.log("shutdowing " + node.id);
    node.boxStroke.animate({'stroke': '#bbb'}, duration,"<>", function(){node.online = false;});
    node.boxFill.animate({'fill': '#bbb'}, duration,"<>");
}

//Animation for a migrate action
function migrate(vm, src, dst, duration) {
	if (LOG) console.log("[ANIM] Migrating "+vm.id+" from "+src.id+" to "+dst.id+" for "+duration+"ms");
	var a = 0;
	
	//A light gray (ghost) VM is posted on the destination
	var ghostDst = new VirtualMachine(vm.id, vm.cpu, vm.mem);
	ghostDst.bgColor = "#eee";
	ghostDst.strokeColor = "#ddd";
	dst.host(ghostDst);
	dst.refresh();
	
	//A light gray VM will move from the source to the destination
	var movingVM = new VirtualMachine(vm.id, vm.cpu, vm.mem);
	movingVM.bgColor = "#eee";
	movingVM.strokeColor = "#ddd";
	movingVM.draw(paper, vm.posX, vm.posY + vm.mem * unit_size);
	movingVM.box.toFront();
	
	var callbackAlreadyCalled = false;
	var animationEnd = function() {

		//Update vm position for reverse animation
		vm.posX = ghostDst.posX;
		vm.posY = ghostDst.posY;

		//The source VM goes away
		src.unhost(vm);
		vm.box.remove();

		//Remove the moving VM
		movingVM.box.remove();

		//The ghost VM becomes normal
		ghostDst.bgColor = "#bbb";
		ghostDst.strokeColor = "#000";

		//Refresh the nodes
		src.refresh();
		dst.refresh();
	}
	//movingVM.box.animate({transform :"T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)}, fast ? 50 : (300 * vm.mem),"<>",
	movingVM.box.animate({transform :"T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)}, duration,"<>",function(){
	    	animationEnd();
	    	callbackAlreadyCalled = true ;
	    }
	);
}

