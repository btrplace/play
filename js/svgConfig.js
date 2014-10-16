/*
Javascript to generate a SVG from a configuration.
@author Fabien Hermenier
*/

var paper;
var columns = 4;
var lines = 2;

//Size of a unit in px
var unit_size = 18;

//Space between the border of the node and the axes
var border = 20;

var scenario;

var animationStep;

//Indicate an action is in progress
var pending = false;

var config = new Configuration();
var backupConfig = undefined

function drawConfiguration(id) {
	if( paper != undefined ){
		paper.clear();
	}

    //Compute the SVG size
    var width = 0;
    var height = 0;

    //Up to 4 nodes side by side
    var max_width = 700;

    var cur_width = 0; //width of the current line
    var max_height = 0; //maximum height of the node on the current line
    //How many nodes per line, how many lines

    var posX = 0;
    var posY = 0;
    for (var i in config.nodes) {
        var n = config.nodes[i];
        var dim = n.boundingBox();

        if (dim[1] > max_height) { max_height = dim[1];}
        n.posY = height;
        if (cur_width + dim[0] > max_width) {
            height += max_height;
            if (width < cur_width) {width = cur_width};
            cur_width = dim[0];
            n.posX = 0;
            n.posY = height;
            if (i == config.nodes.length - 1) {
                height += max_height;
            }
        } else {
            n.posX = cur_width;
            cur_width += dim[0];
            if (i == config.nodes.length - 1) {
                if (width < cur_width) {width = cur_width};
                height += max_height;
            }
        }
    }
    //draw it
    if (paper != undefined) {
	    paper.remove();
    }

    paper = Raphael(id, width, height);
    //paper.setSize('100%','100%');
    // emptying the paper
    paper.clear();

    for (var i in config.nodes) {
        var n = config.nodes[i];
        n.draw(paper,n.posX,n.posY);
    }

	updateClickBindings();
}

var spaceSplitter = /\s/g;

/**
 * Save the configuration into SVG format.
 * It's currently not working. Will be implemented in a future release.
 */
function saveSVG() {
	return false ;
    var text = $("#canvas").get()[0].innerHTML;
        a = document.createElement('a');
        a.download = 'configuration.svg';
        a.type = 'image/svg+xml';
        bb = new(window.BlobBuilder || WebKitBlobBuilder);
        bb.append(text);
        blob = bb.getBlob('image/svg+xml');
        a.href = (window.URL || webkitURL).createObjectURL(blob);
        a.click();
    }
