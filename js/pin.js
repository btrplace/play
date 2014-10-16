//Check for an id


var editor;

function randomConfiguration() {
    config = new Configuration();
    //Generate the 4 nodes
    for (var i = 1; i <= 8; i++) {
        var n = new Node("@N" + i, 6, 6);        
        config.nodes.push(n);
    }    
    //Templates
    var tpls = [[2,2],[2,3],[2,2],[2,4],[2,3]];
    var picked = [];
    var i = 1
    //Pick a random node
    while (i <= 8) {
        var nIdx = Math.floor(Math.random() * config.nodes.length);
        //pick a satisfying size, minimum 2x2
        freeRcs = config.nodes[nIdx].free();
        if (freeRcs[0] <= 1 || freeRcs[1] <= 1) {
            continue
        }
        //console.log(freeRcs)
        //Check for a template that fit
        var c = Math.floor(Math.random() * (freeRcs[0]/4)) + 2
        var m = Math.floor(Math.random() * (freeRcs[1]/4)) + 2
        if (c > freeRcs[0]) {
            c = freeRcs[0]
        }
        if (m > freeRcs[1]) {
            m = freeRcs[1]
        }

        var v = new VirtualMachine("VM" + i, c, m);
        //console.log(v)
        if (config.nodes[nIdx].fit(v)) {
            config.vms.push(v);
            config.nodes[nIdx].host(v);
        }  else {
            console.log("BUG: cannot fit")
        }
        i++
    }
}

function generateSampleScript(cfg) {

     var buf = "namespace sandbox;\n\n";
     buf += "VM[1.." + (cfg.vms.length) + "] : myVMs;\n\n";
         for (var i in cfg.nodes) {
        var n = cfg.nodes[i];
        if (n.vms.length >= 2) {
            buf += ">>spread({" + n.vms[0].id + ", " + n.vms[1].id + "});\n";
            break;
        }
     }
     //One ban on the 3 first VMs that are placed, after vms[5]     
     for (var x = 0; x < config.nodes.length; x++) {
        if (config.nodes[x].vms.length > 0) {
            buf += "ban(" + config.nodes[x].vms[0].id + ", " + config.nodes[x].id + ");\n";
            break;
        }        
     }
     //maxOnlines
    buf += ">>maxOnline(@N[1..8], 5);\n"
    return buf;
}

function init() {    
    var get = GETParameters();

    editor = ace.edit("editor");            
    randomConfiguration();        
    editor.setValue(generateSampleScript(config));
    drawConfiguration("canvas");            
    editor.clearSelection();
}