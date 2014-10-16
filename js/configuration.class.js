function Configuration (ns,vs) {
    this.vms = vs ? vs : [];
    this.nodes = ns ? ns : [];

    this.getNodeIdx = function (n) {
        for (var i in this.nodes) {
            if (this.nodes[i].id == n.id) {
                return parseInt(i);
            }
        }          
    }

    this.getVMIdx = function (v) {
        for (var i in this.vms) {
            if (this.vms[i].id == v.id) {                
                return parseInt(i);
            }
        }              
    }

    this.getNode = function (id) {
        for (var i in this.nodes) {
            if (this.nodes[i].id == id) {
                return this.nodes[i];
            }
        }
    }

    this.getHoster = function(id) {
        for (var i in this.nodes) {
            if (this.nodes[i].isHosting(id)) {
                return this.nodes[i];
            }
        }
    }

    this.getVirtualMachine = function (id) {
        for (var i in this.vms) {
            if (this.vms[i].id == id) {
                return this.vms[i];
            }
        }
    }

    this.getNextNodeID = function(){
    	var candidate = 0;
    	var valid = false;
    	while (!valid) {
    		valid = true;
    		for (var i in this.nodes) {
				if ("N"+candidate == this.nodes[i].id) {
					valid = false;
					candidate++;
					break;
				}
			}
    	}
    	return "N"+candidate;
    }

    this.getNextVMID = function(){
        	var candidate = 0;
        	var valid = false;
        	while (!valid) {
        		valid = true;
        		for (var i in this.vms) {
    				if ("VM"+candidate == this.vms[i].id) {
    					valid = false;
    					candidate++;
    					break;
    				}
    			}
        	}
        	return "VM"+candidate;
    }

    this.toStorage = function(){
    	var result = [],
    		nodes = [];
    	result.push(nodes);
    	result.push(editor.getValue());
    	for(var i in this.nodes){
            nodes.push(this.nodes[i].toStorage());
    	}
    	return result ;
    }

    this.fromStorage = function(configData){
    	this.nodes = [];
    	this.vms = [];
    	for(var i in configData[0]){
 			var nodeData = configData[0][i],
    			node = createNodeFromStorage(nodeData);
    		this.nodes.push(node);
    	}
		editor.setValue(configData[1]);
		drawConfiguration("canvas");
    }
}