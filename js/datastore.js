function loadUseCases(id) {
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
  		loadUseCase();
  	})
}

function loadUseCase(se) {
	var k = $("#use-cases").val();
	if (k == "_") {
		editor.setReadOnly(false);
		//editable configuration
		canEdit = true;
	} else {
		var promise = $.ajax({
  			type: "GET",  		
  			url: entry_point + "/store/" + k
  		});
  		promise.done(function (useCase) {
  			$("#description").html(useCase.description);
  			$("#solve").removeAttr("disabled");  		
  			editor.setValue(useCase.script);  		  		
  			editor.clearSelection();
  			editor.setReadOnly(true);
  			canEdit = false;
  		})
  		promise.fail(function (xhr) {
  			console.log(xhr.status);
  			console.log(xhr.responseText);  		
  		});
  	}
}