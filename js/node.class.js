function Node(name, cpu, mem) {
    this.id = name;
    this.cpu = cpu;
    this.mem = mem;
    this.online = true;
    this.vms = [];
    this.selected = false;

    this.boundingBox = function () {
	    return [2 * border + unit_size * MAX_CPU, 2 * border + unit_size * MAX_MEM];
    };

    this.draw = function (canvas, x, y) {
        console.log("draw " + this.id);
    	//shift y to make the node 0,0 be bottom left, similarly to the VMs.
    	this.originX = x;
    	this.originY = y;
    	y = y + (MAX_MEM - this.mem) * unit_size
	    this.posX = x;
	    this.posY = y;

	    if( this.boxStroke) this.boxStroke.remove();
	    if( this.boxFill) this.boxFill.remove();

        this.boxStroke = canvas.group();        
	    this.canvas = canvas;
	    var box_width = this.cpu * unit_size;
	    var box_height = this.mem * unit_size;
	    var width = 2 * border + box_width;
	    var height = 2 * border + box_height;
	    var rc_bg = "#fff";

	    var bgColor = this.online ? "black" : "#bbb";

 	    //lightgray for the resources area
 	    var rect = canvas.rect(x + border, y + border, box_width, box_height); 	    
 	    // Fill with transparent color to catch click
 	    rect.attr({'fill':'rgba(0,0,0,0)'});
 	    this.rect = rect;

	    this.boxStroke.add(rect);

	    //labels
        this.boxFill = canvas.group();
        this.boxFill.add(canvas.text(x + width - border,y + height - 7,"cpu").attr({'text-anchor':'end'}));
        this.boxFill.add(canvas.text(x + border,y + border-3, "mem"));
        
	    //Node name, bottom left
        this.title = canvas.text(x + border, y + height - 7, this.id);
	    this.boxFill.add(this.title);
        this.boxFill.attr({fill: bgColor});
        //Resource grid
	    for (var i = 1; i < this.cpu; i+=1) {
	        var pos = border + i * unit_size;
	        this.boxStroke.add(canvas.path("M " + (x + pos) + " " + (y + border) + " l " + " 0 " + " " + box_height).attr({'stroke-dasharray' : '7 3'}));
	    }
    	for (var i = 1; i < this.mem; i+=1) {
	        var pos = border + i * unit_size;
	        this.boxStroke.add(canvas.path("M " + (x + border) + " " + (y + pos) + " l " + box_width + " 0").attr({'stroke-dasharray' : '7 3'}));
	    }

        this.boxStroke.attr({stroke: bgColor});

        var self = this;
        this.boxStroke.click(function f(x) {             
            x.stopPropagation();                    
            setSelectedElement(self);                   
        });         

	    //The VMs
	    //get the origin of the boundingBox
	    /*var oX = this.posX + border;
	    var oY = this.posY + border + box_height;
	    for (var i in this.vms) {
	        this.vms[i].draw(canvas,oX,oY);
	        //Update the position by the VMs bounding box
	        oX += this.vms[i].boundingBox()[0];
	        oY -= this.vms[i].boundingBox()[1];
	    }*/
        this.refreshVMs();

		//var drawingElements = $.merge(this.boxStroke, this.boxFill);
		//var drawingElements = this.boxStroke;
		var self = this ;
        if (this.selected) {
            this.select();
        }

    }

    this.refreshVMs = function() {
        //get the origin of the boundingBox
        var box_width = this.cpu * unit_size;
        var box_height = this.mem * unit_size;
        var oX = this.posX + border;
        var oY = this.posY + border + box_height;
        for (var i in this.vms) {
            this.vms[i].draw(this.canvas,oX,oY);
            //Update the position by the VMs bounding box
            oX += this.vms[i].boundingBox()[0];
            oY -= this.vms[i].boundingBox()[1];
        }
    }
	this.select = function() {
			this.rect.attr({
				'fill':'#DBDEC5',
				'fill-opacity':'1'
			});		
            this.selected = true;
	}
	this.unSelect = function() {
		this.rect.attr({'fill-opacity':'0'});
        this.selected = false;
	}

    this.host = function(vm) {
		this.vms.push(vm);
    }

    this.unhost = function(vm) {
        for (var i in this.vms) {
            if (this.vms[i].id == vm.id) {
                if (this.vms[i].box) this.vms[i].box.remove();
                this.vms.splice(i, 1);
                break;
            }
        }
    }

    this.isHosting = function(id) {
        for (var i in this.vms) {
            if (this.vms[i].id == id) {
                return true;
            }
        }
        return false;
    }

    this.fit = function(vm) {
	    var freeCPU = this.cpu - vm.cpu;
	    var freeMem = this.mem - vm.mem;
	    for (var v in this.vms) {
	        freeCPU -= this.vms[v].cpu;
	        freeMem -= this.vms[v].mem;

	        if (freeMem < 0 || freeCPU < 0) {
	            break;
	        }
	    }
	    return freeMem >= 0 && freeCPU >= 0;
    }

    this.delete = function(){
    	for (var i in this.vms) {
    		var vm = this.vms[i];
    		vm.delete(false);
    	}
    	config.nodes.splice(config.nodes.indexOf(this), 1);
    }

    this.free = function() {
        var freeCPU = this.cpu;
        var freeMem = this.mem;
        for (var v in this.vms) {
            freeCPU -= this.vms[v].cpu;
            freeMem -= this.vms[v].mem;
        }
        return [freeCPU, freeMem];
    }

    this.onKeyEvent = function(k) {
    	switch(k) {
    		case KEY_UP: 
    			if (this.mem < MAX_MEM) {
    				this.mem++;
    				this.refresh();    				
    			}    	
    			break;
    		case KEY_DOWN:
    			if (this.mem > 3 && this.free()[1] > 0) {
    				this.mem--;
    				this.refresh();
    			}
    			break;
    		case KEY_LEFT:
    			if (this.cpu > 3 && this.free()[0] > 0) {
    				this.cpu--;
    				this.refresh();
    			}
    			break;
    		case KEY_RIGHT:
    			if (this.cpu < MAX_CPU) {
    				this.cpu++;
    				this.refresh();
    			}
    			break;
    		case KEY_D:
    			if (this.vms.length > 0) {
    				alert("The node is hosting VMs");    				
    			} else {
    				this.delete();
                    drawConfiguration("canvas");                    
    			}    			
    			break;
    		case KEY_O:
    			if (this.online && this.vms.length > 0) {
    				alert("The node is hosting VMs");    				
    			} else {
    				this.online = !this.online;
    				this.refresh();
    			}    		
    			break;
    		case KEY_N:
    			if (this.online) {
					var vm = new VirtualMachine(config.getNextVMID(), 1, 2);
					if (!this.fit(vm)) {
						vm = new VirtualMachine(config.getNextVMID(), 2, 1);
					}
					if (this.fit(vm)) {
						this.host(vm);
                        config.vms.push(vm);                        
                        this.refresh();
                        setSelectedElement(vm);                        
					} else {
                        alert("No enough space");
                    }
    			} else {
                    alert("An offline node cannot host VMs");
                }    			
    	}
    }
}
