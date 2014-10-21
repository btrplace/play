function VirtualMachine(id, cpu, mem) {
    this.id = id;
    this.cpu = cpu;
    this.mem = mem;

    this.bgColor = "#bbb";
    this.strokeColor = "black";
    this.draw = function(canvas, x, y) {
		if( this.box != undefined ) {
			this.box.remove();
		}
        this.box = canvas.set();

	    //Bounding box
	    this.rect = canvas.rect(x, y - this.mem * unit_size, this.cpu * unit_size,  this.mem * unit_size);
	    this.rect.attr({'fill' : this.bgColor, 'stroke' : this.strokeColor});
	    this.rec
	    this.box.push(this.rect);
	    var self = this;
 	    this.rect.click(function f(x) { 	    	
 	    	x.stopPropagation(); 	    	 	    
 	    	setSelectedElement(self); 	    	 	    	
 	    });	    

	    //Identifier
	    var t = canvas.text(x + (this.cpu * unit_size) / 2, y - ( this.mem * unit_size) / 2, this.id).attr({'font-size':'12pt'});
	    if (this.cpu == 1) {
	        t.rotate(-90);
	    }
	    this.box.push(t);

		var self = this ;
		this.box.forEach(function(e){
			e.node.setAttribute("class","vmZone");
			e.node.setAttribute("sandboxVMID", self.id.substr(2));
		});

	    //Upper left corner
		this.posY = y - this.mem * unit_size;
    	this.posX = x;

    }

    this.boundingBox = function() {
	    return [this.cpu * unit_size, this.mem * unit_size];
    }

    this.setSelected = function(isSelected){
    		this.isSelected = isSelected ;
    		this.updateSelectionDraw();
    }

	this.select = function() {
		this.previousColor = this.rect.attr("fill");
		this.rect.attr({'fill':'#d2d8b1'});
	}
	this.unSelect = function() {
		this.rect.attr({'fill':this.bgColor});
	}

	this.toStorage = function(){
		return [this.id, this.cpu, this.mem];
	}

	this.delete = function(doUnhost){
		if (typeof(doUnhost) == "undefined") {
			var doUnhost = true ;
		}
		if (doUnhost) {
			config.getHoster(this.id).unhost(this);
		}
		config.vms.splice(config.vms.indexOf(this), 1);
	}	
}
