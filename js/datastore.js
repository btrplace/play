function loadUseCases(id) {
	var promise = $.ajax({
  		type: "GET",  		
  		url: entry_point + "/store/"
  	});
  	promise.done(function (titles) {
  		var buf = "";
  		titles.forEach(function (t) {
  			buf += "<option>" + t + "</option>";
  		});
  		buf += "<option>custom ...</custom>";
  		$("#" + id).removeAttr("disabled").html(buf);
  	})

}