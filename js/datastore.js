function share() {
  if (canEdit) {
	 $("#modal-share-custom").modal('toggle');
  } else {
    $("#premade-url").val(window.location.href + "?uc=" + current).focus();
    $("#modal-share-premade").modal('toggle');
  }
}

function newUseCase() {	
  var i = {
    title: $("#input-title").val(),
    description: $("#input-description").val(),
    script: editor.getValue(),
    model: JSON.stringify(model2JSON(config))
  }
  var promise = $.ajax({
    type: "POST",      
    url: endPoint + "/store/",
    contentType: 'application/json',    
    dataType: 'text',
    data: JSON.stringify(i),    
  });
  promise.done(function (id, status, xhr) {      
    $("#modal-share-custom").modal('hide');
    $("#premade-url").val(window.location.href + "?uc=" + id).focus();
    $("#modal-share-premade").modal('show');
  })
  promise.fail(function (xhr) {
    var location = xhr.getResponseHeader('Location');
    console.log(xhr.responseText);
  });


	$("#modal-share-custom").modal('toggle');
}

function readOnly(b) {  
    if (b) {
      $("#description").show()      
      $(".custom").hide();    
    } else {
      $("#description").hide();
      $(".custom").show();    
    }    
    editor.clearSelection();
    editor.setReadOnly(b);
    canEdit = !b;    
}

function randomModel() {
  var cfg = new Configuration();    
  for (var i = 1; i <= 8; i++) {
    var n = new Node("N" + i, 6, 6);
    cfg.nodes.push(n);
  }

  //Templates
  var tpls = [[2,2],[2,3],[2,2],[2,4],[2,3]];
  var picked = [];
  var i = 1
  //Pick a random node
  while (i <= 16) {
    var nIdx = Math.floor(Math.random() * cfg.nodes.length);
    //pick a satisfying size, minimum 2x2
    freeRcs = cfg.nodes[nIdx].free();
    if (freeRcs[0] <= 1 || freeRcs[1] <= 1) {
        continue
    }
    var c = Math.floor(Math.random() * (freeRcs[0]/4)) + 2
    var m = Math.floor(Math.random() * (freeRcs[1]/4)) + 2
    if (c > freeRcs[0]) {
      c = freeRcs[0]
    }
    if (m > freeRcs[1]) {
      m = freeRcs[1]
    }

    var v = new VirtualMachine("VM" + i, c, m);    
    if (cfg.nodes[nIdx].fit(v)) {
      cfg.vms.push(v);
      cfg.nodes[nIdx].host(v);
    } else {
      console.log("BUG: cannot fit")
    }
    i++
  }
  return cfg;
}

function randomScript(cfg) {
  var buf = "namespace sandbox\n\n";
  buf += "VM[1.." + cfg.vms.length + "]: myVMs;\n\n"
  for (var i in cfg.nodes) {
    var n = cfg.nodes[i];
    if (n.vms.length >= 2) {
      buf += ">>spread({" + n.vms[0].id + ", " + n.vms[1].id + "});\n";
      break;
    }
  }
  //One ban on the 3 first VMs that are placed, after vms[5]  
  nIdx = -1;
  while (nIdx < 0 || cfg.nodes[nIdx].vms.length == 0) {
    nIdx = Math.floor(Math.random() * cfg.nodes.length);  
  }  
  buf += ">>ban(" + cfg.nodes[nIdx].vms[0].id + ", " + cfg.nodes[nIdx].id + ");\n";
  buf += ">>maxOnline(@N[0..3], 3);\n"
  return buf;
}


function randomInstance() {
  //8 nodes
  var cfg = randomModel();  
  var scr = randomScript(cfg);
  var i = {};
  i.model = JSON.stringify(model2JSON(cfg));
  i.script = scr;
  return i;
}

function displayInstance(i) {  
  $("#description").html(i.description);          
  config = JSON2Model(JSON.parse(i.model));
  editor.getSession().setAnnotations([]);  
  editor.setValue(i.script);
  drawConfiguration("canvas");    
  $("#input-description").val(i.description);     
  $("#input-title").val($( "#use-cases option:selected" ).text());
  $("#solve").removeAttr("disabled");    
  hide(["solution","error"]); 
}

function loadUseCase(uc) {
	var k = uc;
	//hide solution panel if needed
	var p = $("#solution");
	
	if (k == undefined) {		
		k = $("#use-cases").val();
	}	
	if (k == "_") {				
    displayInstance(randomInstance());
    readOnly(false);
	} else {
		var promise = $.ajax({
  			type: "GET",  		
  			url: endPoint + "/store/" + k
  		});
  		promise.done(function (useCase) {              
        current = uc;
        displayInstance(useCase);
        readOnly(true);
  		})
  		promise.fail(function (xhr) {
  			if (xhr.status == 404) {
  				error("Use case '" + uc + "' not found");
  			}  else {
  				console.log(xhr.status);
  				console.log(xhr.responseText);  				
  			}
  		});
  	}
}