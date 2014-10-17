function loadUseCases(id, uc) {
	var promise = $.ajax({
  		type: "GET",  		
  		url: entry_point + "/store/"
  	});
  	promise.done(function (summaries) {
  		var buf = "";  		
  		var first = true;
  		summaries.forEach(function (s) {
  			buf += "<option value=\"" + s.key + "\">" + s.title + "</option>";  			
  			/*if (first) {
  				loadUseCase(s.key);
  				first = false;
  			}*/
  		});
  		buf += "<option value='_'>custom ...</custom>";
  		$("#" + id).removeAttr("disabled").html(buf);  		
  		loadUseCase(uc);
  	})
}

function loadUseCase(uc) {
	var k = uc;
	//hide solution panel if needed
	var p = $("#solution");
	if (p.is(":visible")) {
		p.hide("slide", {direction: "down"}, 200);
	}
	if (k == undefined) {		
		k = $("#use-cases").val();
	}
	$("#solve").removeAttr("disabled");
	if (k == "_") {		
		editor.setReadOnly(false);		
		canEdit = true;
		var desc = "You can now customize both the scripts and the model." +
			"<br/>" +
			"Keyboard shortcuts to customize the model:"+
				"<ul>"+
				"<li><b>&#8592;, &#8593;, &#8594;,&#8595;</b>: change the resource levels of the selected element</li>"+
				"<li><b>N</b> : new VM (if a node is selected), or new node</li>"+
				"<li><b>O</b> : state switch for a node (online, offline)</li>"+
				"<li><b>D</b> : delete the selected element</li>"+
				"</ul>";			
		$("#description").html(desc);
	} else {
		var promise = $.ajax({
  			type: "GET",  		
  			url: entry_point + "/store/" + k
  		});
  		promise.done(function (useCase) {
  			$("#description").html(useCase.description);  			
  			editor.setValue(useCase.script);  		  		
  			editor.clearSelection();
  			editor.setReadOnly(true);  			
  			config = JSON2Model(JSON.parse(useCase.model)); //weird
  			drawConfiguration("canvas");
  			canEdit = false;
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