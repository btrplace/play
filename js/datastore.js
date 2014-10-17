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

function editDescription() {
	$("#input-description").val($("#description").html());
	$("#modal-desc").modal('toggle');
}

function saveDescription() {
	$("#description").html($("#input-description").val());
	$("#modal-desc").modal('toggle');
}

function loadUseCase(uc) {
	var k = uc;
	//hide solution panel if needed
	var p = $("#solution");
	hide(["solution","error"]);
	editor.getSession().setAnnotations([]);
	if (k == undefined) {		
		k = $("#use-cases").val();
	}
	$("#solve").removeAttr("disabled");
	if (k == "_") {		
		editor.setReadOnly(false);		
		canEdit = true;
		$(".custom").show();
	} else {
		$(".custom").hide();
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