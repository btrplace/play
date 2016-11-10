var paused = true;

var schedule;

var playing = false;
var now;
var unit = 130;
var SPEED = 1000;
var acceleration = 1;
var forward = true;

function makeSpan(actions) {
	var h = 1;
	actions.forEach(function(a) {
		if (a.end > h) {
			h = a.end;
		}
	});
	return h;
}

function makeAction(unit, lbl, start, end, h) {
	var actionBar = $("<div></div>").addClass("actionBar"),
		actionLine = $("<div></div>").addClass("actionLine"),
		actionContainer = $("<div></div>").addClass("actionContainer");
	actionBar.html(lbl);
	actionContainer.append(actionBar);
	actionContainer.append(actionLine);

	//+1 to make a space from the left border
	var d = end - start;
	if (d == 0) {d = 1};
	actionBar.css({
		left: (start + 1) * unit,
		width: d * unit
	});
	return actionContainer;
}

function makeTimeline(unit, h) {
	var timeline = $("<div></div>").addClass("graduations");
	for (var i = 0; i <= h; i++) {
		var x = (i + 1) * unit;
		var g = $("<div></div>").addClass("timestamp");
		var m = $("<span>" + i + "</span>").addClass("timemark");
		g.css({
			left: x
		});
		m.css({
			left: x
		});
		timeline.append(m);
	}
	return timeline;
}

function label(vmNs, nodeNs, a) {
	switch (a.id) {
		case "migrateVM":
			return "migrate " + name(vmNs, a.vm) + " to " + name(nodeNs, a.to);
		case "bootNode":
			return "boot " + name(nodeNs, a.node);
		case "shutdownNode":
			return "shutdown " + name(nodeNs, a.node);
		case "allocate":
			var diff = a.amount - config.vms[a.vm][a.rc];

			return (diff > 0 ? "+" : "") + diff + " " + a.rc + " for "  + name(vmNs, a.vm);
		default:
			console.log("Unsupported action: " + a.id);
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
	plan.origin.views.forEach(function(view) {
		if (view.id == "ns") {
			if (view.type == "vm") {
				vmNs = view
			} else if (view.type == "node") {
				nodeNs = view;
			}
		}
	});
	var div = $("#" + to);
	div.html("");
	var h = makeSpan(plan.actions);
	var actions = $("<div></div>").addClass("actionLines");
	//sort the actions
	plan.actions.sort(function(a, b){return a.start-b.start;});
	plan.actions.forEach(function(a) {
		var lbl = label(vmNs, nodeNs, a);
		actions.append(makeAction(unit, lbl, a.start, a.end, h));
	});
	var controler = "<div class='controler'>" + "<a class='btn btn-default btn-green backward' onclick='rwd()' disabled='disabled'><i class='fa fa-fast-backward'></i></a>" + "<a class='btn btn-default btn-green forward' onclick='playPause()'><i id='play' class='fa fa-play'></i></a>" + "<a class='btn btn-default btn-green forward' onclick='ffwd()'><i class='fa fa-fast-forward'></i></a>" + "</div>";
	div.append(controler);
	div.append(makeTimeline(unit, h));
	div.append(actions);
	var cursor = $("<div></div>").addClass("cursor").css("left", unit);
	cursor.append($("<div></div>").addClass("time-mark"));
	actions.append(cursor);
	div.append();
	now = 0;
	paused = true;
	playing = false;
	forward = true;
	schedule = prepareReconfiguration(plan.actions, h);
}

function ffwd() {
	$("#player").find(".btn-green").attr("disabled", "disabled");
	paused = false;
	acceleration = 5;
	forward = true;
	if (!playing) {
		run();
	}
}

function rwd() {
	if (now == 0) {
		return;
	}
	$("#player").find(".btn-green").attr("disabled", "disabled");
	paused = false;
	acceleration = 5;
	forward = false;
	if (!playing) {
		run();
	}
}

function playPause() {
	paused = !paused;
	forward = true;
	var icon = $("#play");
	if (icon.hasClass("fa-play")) {
		icon.removeClass("fa-play").addClass("fa-pause");
		acceleration = 1;
		$("#player").find(".backward").removeAttr("disabled");
		run();
	} else {
		icon.removeClass("fa-pause").addClass("fa-play");
	}
}

function run() {
	if (paused) {
		return;
	}
	playing = true;
	var deferreds = [];
	schedule[forward ? now : now - 1].forEach(function(a) {
		deferreds = deferreds.concat(apply(a));
	})
	//the cursor
	deferreds.push(animateCursor());
	$.when.apply($, deferreds).then(
		function() {
			playing = false;
			if (now == 0) {
				$("#player").find(".backward").attr("disabled", "disabled");
				$("#player").find(".forward").removeAttr("disabled");
				$("#play").removeClass("fa-pause").addClass("fa-play");
				paused = true;
				forward = true;
			} else if (now == schedule.length) {
				$("#player").find(".forward").attr("disabled", "disabled");
				$("#player").find(".backward").removeAttr("disabled");
				$("#play").removeClass("fa-pause").addClass("fa-play");
				paused = true;
				forward = false;
			} else {
					run();
			}
		}
	);
}

function apply(a) {
	var duration = ((a.end - a.start) * SPEED) / acceleration;
	if (["bootNode", "shutdownNode", "migrateVM","allocate"].indexOf(a.id) < 0) {
		console.log("Unsupported action '" + a.id + "'");
		return;
	}
	if (forward) {
		switch (a.id) {
			case 'bootNode':
				return bootNode(config.nodes[a.node], duration);
			case 'shutdownNode':
				return shutdownNode(config.nodes[a.node], duration);
			case 'allocate':
				//make it reversible
				if (a.orig == undefined) {
					a.orig = config.vms[a.vm][a.rc];
				}
				return allocate(config.vms[a.vm], config.nodes[a.on], a.rc, a.amount, SPEED / acceleration);
			case 'migrateVM':
				return migrate(config.vms[a.vm], config.nodes[a.from], config.nodes[a.to], duration, a.hooks.post);
		}
	}
	switch (a.id) {
		case 'bootNode':
			return shutdownNode(config.nodes[a.node], duration);
		case 'shutdownNode':
			return bootNode(config.nodes[a.node], duration);
		case 'allocate':
				return allocate(config.vms[a.vm], config.nodes[a.on], a.rc, a.orig, SPEED / acceleration);
		case 'migrateVM':
			return migrate(config.vms[a.vm], config.nodes[a.to], config.nodes[a.from], duration, a.hooks.post);
	}
}

function prepareReconfiguration(actions, h) {
	var groups = [];
	for (var i = 0; i < h; i++) {
		groups[i] = [];
	}
	actions.forEach(function(a) {
		if (!groups[a.start]) {
			groups[a.start] = [];
		}
		groups[a.start].push(a);
	})
	return groups;
}

function animateCursor() {
	var to = (1 + now + (forward ? 1 : -1)) * unit;
	var duration = SPEED / acceleration;
	return $(".cursor").animate({
		left: to + "px"
	}, duration, "linear", function() {now = now + (forward ? 1 : -1)});
}

//Animation for booting a node
function bootNode(node, duration) {
	var d1 = $.Deferred();
	var d2 = $.Deferred();
	node.boxStroke.animate({
		stroke: 'black'
	}, duration, mina.backin, function() {
		node.online = true;
		d1.resolve();
	});
	node.boxFill.animate({
		'fill': 'black'
	}, duration, mina.backin, function() {
		d2.resolve()
	});
	return [d1.promise(), d2.promise()];
}

// Animation for shutting down a node
function shutdownNode(node, duration) {
	//console.log("shutdown " + node.id);
	var d1 = $.Deferred();
	var d2 = $.Deferred();
	node.boxStroke.animate({
		'stroke': '#bbb'
	}, duration, mina.linear, function() {
		node.online = false;
		d1.resolve();
	});
	node.boxFill.animate({
		'fill': '#bbb'
	}, duration, mina.linear, function() {
		d2.resolve();
	});
	return [d1.promise(), d2.promise()];
}

function allocate(vm, src, rc, q, duration) {
	var d = $.Deferred();
	var x = setInterval(function () {
		vm[rc] = q;
		src.refreshVMs();
		d.resolve();
		clearInterval(x);
	}, duration);
	return [d.promise()];
}

//Animation for a migrate action
function migrate(vm, src, dst, duration, post) {
	//console.log("migrate " + vm.id + " from " + src.id + " to " + dst.id);
	var a = 0;
	//A light gray (ghost) VM is posted on the destination
	var mem = vm.mem;
	var cpu = vm.cpu;
	if (post && post.length > 0) {
		post.forEach(function (rc) {
			if (rc.orig == undefined) {
				rc.orig = config.vms[rc.vm][rc.rc];
			}
			if (rc.rc == "cpu") {
				cpu = forward ? rc.amount : rc.orig;
			} else if (rc.rc == "mem") {
				mem = forward ? rc.amount : rc.orig;
			} else {
				console.log("Unsupported resource '" + rc.type + "'");
			}
		})
	}
	var ghostDst = new VirtualMachine(vm.id, cpu, mem);
	ghostDst.bgColor = "#eee";
	ghostDst.strokeColor = "#ddd";
	dst.host(ghostDst);
	dst.refreshVMs();

	//A light gray VM will move from the source to the destination
	var movingVM = new VirtualMachine(vm.id, vm.cpu, vm.mem);
	movingVM.bgColor = "#eee";
	movingVM.strokeColor = "#ddd";
	movingVM.draw(paper, vm.posX, vm.posY + vm.mem * unit_size);
	//	movingVM.box.toFront();

	var d = $.Deferred();
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
		src.refreshVMs();
		dst.refreshVMs();
	}
	var p1 = movingVM.box.animate({
		transform: "T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)
	}, duration, mina.easeinout, function() {
		animationEnd();
		d.resolve();
	});
	return [d.promise()];
}

function doms(objs) {
	var dom = $();
	objs.forEach(function(o) {
		dom = dom.add(o.node)
	});
	return dom;
}