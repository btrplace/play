function JSON2Model(js) {
    //extract the views
    var vmNs, nodeNs, cpu, mem;    
    js.views.forEach(function (v) {
        if (v.id == "shareableResource") {
            if (v.rcId == "cpu") {cpu = v;}
            else if (v.rcId == "mem") {mem = v;}            
        } else if (v.id =="ns") {
            if (v.type == "vm") {vmNs = v;}
            else if (v.type == "node") {nodeNs = v;}         
        }
    });
    var c = new Configuration();
    Object.keys(nodeNs.map).forEach(function (name) {
        var nid = nodeNs.map[name];
        var n = new Node(name, cpu.nodes[nid], mem.nodes[nid]);
        c.nodes[nid] = n;
        n.online = js.mapping.offlineNodes.indexOf(nid) <= 0;
        if (n.online) {
            var inside = js.mapping.onlineNodes[nid];
            inside.runningVMs.forEach(function (vid) {
                var vmName = nameFromId(vmNs, vid);
                var vm = new VirtualMachine(vmName, cpu.vms[vid], mem.vms[vid]);
                c.vms[vid] = vm;
                n.vms[vid] = vm;
            });
        } 
    }); 
    return c;
}

function nameFromId(ns, id) {
    var name = undefined;
    Object.keys(ns.map).forEach(function (n) {
        if (ns.map[n] == id) {
            if (ns.type=="vm") {
                name = n.substring(n.indexOf(".") + 1);
            } else {
                name = n;    
            }
            
            return true;
        } 
    });
    return name;
}

function model2JSON(m) {	    
	var mapping = {onlineNodes:{}, offlineNodes:[], readyVMs:[]};    
    m.nodes.forEach(function (n) {
	if (n.online) {
    	var x = {runningVMs : [], sleepingVMs : []};                                        
            n.vms.forEach(function (v) {                    
                x.runningVMs.push(m.getVMIdx(v))
            });                          
            mapping.onlineNodes[m.getNodeIdx(n)] = x;
        } else {
            mapping.offlineNodes.push(m.getNodeIdx(n));
        }
	});
	//resources & naming service
	var cpu = {id : "shareableResource",rcId:"cpu", nodes:{}, vms:{},defCapacity: 6, defConsumption: 6};
    var mem = {id : "shareableResource",rcId:"mem", nodes:{}, vms:{},defCapacity: 6, defConsumption: 6};
    var nsVm = {id : "ns",type: "vm", map: {}};
    var nsNode = {id : "ns",type: "node", map: {}};
	m.nodes.forEach(function (n) {
        var idx = m.getNodeIdx(n)
        cpu.nodes[idx] = n.cpu;
        mem.nodes[idx] = n.mem;
        nsNode.map[n.id] = idx;
    });
    m.vms.forEach(function (v) {
        var idx = m.getVMIdx(v);
        cpu.vms[idx] = v.cpu;
        mem.vms[idx] = v.mem;
        nsVm.map["sandbox." + v.id] = idx;
	});        
	return {mapping: mapping,views: [cpu, mem, nsVm, nsNode]}    
}

function instance2JSON(m, scr) {
	return {model: model2JSON(m), script: scr};
}