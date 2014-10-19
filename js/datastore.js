function share() {
	$("#modal-share").modal('toggle');
}

function newUseCase() {	
	$("#modal-share").modal('toggle');
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
		$("#description").hide();		
		canEdit = true;
		$(".custom").show();
	} else {
		$(".custom").hide();
		$("#description").show();
		var promise = $.ajax({
  			type: "GET",  		
  			url: entry_point + "/store/" + k
  		});
  		promise.done(function (useCase) {
  			$("#description").html(useCase.description);  			
  			editor.setValue(useCase.script);  		  		
  			editor.clearSelection();
  			editor.setReadOnly(true);  			        
  			config = JSON2Model(JSON.parse(useCase.model));
  			drawConfiguration("canvas");
  			canEdit = false;
			$("#input-description").val(useCase.description);			
			$("#input-title").val($( "#use-cases option:selected" ).text());
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