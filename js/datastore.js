function loadUseCases(id) {
	var promise = $.ajax({
  		type: "GET",  		
  		url: entry_point + "/store/"
  	});
  	promise.done(function (titles) {
  		var buf = "";
  		var first = true;
  		titles.forEach(function (t) {
  			buf += "<option>" + t + "</option>";
  			if (first) {
  				loadUseCase(t);
  				first = false;
  			}
  		});
  		buf += "<option>custom ...</custom>";
  		$("#" + id).removeAttr("disabled").html(buf);  		
  	})
}

function loadUseCase(id) {
	var promise = $.ajax({
  		type: "GET",  		
  		url: entry_point + "/store/" + id
  	});
  	promise.done(function (useCase) {
  		$("#description").html(useCase.description);
  		$("#solve").removeAttr("disabled");  		
  		editor.setValue(useCase.script);  		  		
  		editor.clearSelection();
  	})
  	promise.fail(function (xhr) {
  		console.log(xhr.status);
  		console.log(xhr.responseText);  		
  	});
}