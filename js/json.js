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