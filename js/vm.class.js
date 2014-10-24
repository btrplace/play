function VirtualMachine(id, cpu, mem) {
    this.id = id;
    this.cpu = cpu;
    this.mem = mem;

    this.bgColor = "#bbb";
    this.strokeColor = "black";
    this.selected = false;

    this.draw = function(canvas, x, y) {
        if (this.box != undefined) {
            this.box.remove();
        }
        this.box = canvas.set();

        //Bounding box
        this.rect = canvas.rect(x, y - this.mem * unit_size, this.cpu * unit_size, this.mem * unit_size);
        this.rect.attr({
            'fill': this.bgColor,
            'stroke': this.strokeColor
        });
        this.box.push(this.rect);
        var self = this;
        this.rect.click(function f(x) {
            x.stopPropagation();
            setSelectedElement(self);
        });

        //Identifier
        var t = canvas.text(x + (this.cpu * unit_size) / 2, y - (this.mem * unit_size) / 2, this.id).attr({
            'font-size': '12pt'
        });
        t.click(function f(x) {
            x.stopPropagation();
            setSelectedElement(self);
        });
        if (this.cpu == 1) {
            t.rotate(-90);
        }
        this.box.push(t);

        var self = this;
        
        //Upper left corner
        this.posY = y - this.mem * unit_size;
        this.posX = x;

        if (this.selected) {
            this.select();
        }
    }

    this.boundingBox = function() {
        return [this.cpu * unit_size, this.mem * unit_size];
    }

    this.select = function() {
        this.previousColor = this.rect.attr("fill");
        this.rect.attr({
            'fill': '#d2d8b1'
        });
        this.selected = true;
    }
    this.unSelect = function() {
        this.rect.attr({
            'fill': this.bgColor
        });
        this.selected = false;
    }

    this.delete = function(doUnhost) {
        if (typeof(doUnhost) == "undefined") {
            var doUnhost = true;
        }
        if (doUnhost) {
            config.getHoster(this.id).unhost(this);
        }
        config.vms.splice(config.vms.indexOf(this), 1);
    }

    this.onKeyEvent = function(k) {
        var host = config.getHoster(this.id);
        switch (k) {
            case KEY_UP:
                if (host.free()[1] > 0) {
                    this.mem++;
                    host.refresh();
                }
                break;
            case KEY_DOWN:
                if ((this.mem == 2 && this.cpu != 1) || this.mem > 2) {
                    this.mem--;
                    host.refresh();
                }
                break;
            case KEY_LEFT:
                if ((this.cpu == 2 && this.mem != 1) || this.cpu > 2) {
                    this.cpu--;
                    host.refresh();
                }
                break;
            case KEY_RIGHT:
                if (host.free()[0] > 0) {
                    this.cpu++;
                    host.refresh();
                }
                break;
            case KEY_D:
                this.delete();
                host.refresh();
                break;
        }
    }
}