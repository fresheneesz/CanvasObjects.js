import * as Drawable from '../../Drawable'
import * as Point from '../../Point'
import * as proto from 'proto'
import * as xolor from 'xolor'
import defaultExport from 'fabric'

export const Ship = proto(Drawable, function(superclass) {
	this.init = function(p,rot, size) {
		superclass.init.call(this, p, rot);
		
		this.size = size;
		this.color = xolor('red');
		this.subShips = [];
		
		// private members
			
		this.weapons = [];
		this.targets = [];
		
	}
		
	// public methods

    // view - Should be a fabric object
	this.draw = function(ctx) {
		// draw targets
		for(var n in this.targets) {
            drawRect(ctx, "red", 4, 4, this.targets[n], 0)
		}
	}
	
	this.addWeapon = function (w) {
		this.weapons.push(w);
		this.add(w);	
		for(var n in this.targets) {
			w.target(this.targets[n]);
		}	
	}
	
	this.target = function(p) {
		this.targets.push(p);
		for(var n in this.weapons) {
			this.weapons[n].target(p);	
		}	
		for(var n in this.subShips) {
			this.subShips[n].target(p);
		}
	}
	
	this.addShip = function(ship) {
		this.subShips.push(ship);	
		for(var n in this.targets) {
			ship.target(targets[n]);
		}
	}
})


export var Fighter = proto(Ship, function(superclass) {
	this.init = function(p,rot, size, mainColor) {
		superclass.init.call(this, p,rot, size)
		
		var colorA = mainColor, colorB = colorA.comp(); 
		var colors = [colorA, colorB, colorB];
		var lines = [];
		for(var n=0; n<3; n++) {
			var distanceFromCenter = size*5;
			var lineWidth = size*5;
			var rotation = n*120;
			
			var line = 	Line(Point(0,-distanceFromCenter),0, size,lineWidth, colors[n]);
				line.rotateAround(Point(0,0), rotation);
			
			this.add(line);
			lines.push(line);
			
			//color = color.add('#004488');
		}

        var weaponColor = xolor.random()
        weaponColor.lightness(.8*weaponColor.lightness())
		var weapon = Weapon(Point(20,20),0, 500,2000,210, size, weaponColor);
			this.addWeapon(weapon);
			weapon.p(lines[1].end());

		weapon = Weapon(Point(20,20),0, 500,2000,210, size, xolor('red').lightness(.8*xolor('red').lightness()));
			this.addWeapon(weapon);
			weapon.p(lines[2].start());
	}
})

export var Station = proto(Ship, function(superclass) {
	this.init = function(p,rot, size, type) {
		if(type === undefined) {//type = 'normal'
			var distanceFromCenter = size*14;
		} else {
			var	distanceFromCenter = size*3;
		}
		
		superclass.init.call(this, p,rot, size);
		
		this.selected = false;
		
		var n=0;	
		for(var n=0; n<6; n++) {
			var rotation = 30+n*60;
			var secondaryRotation = 0;
			if(type === 'alien') {
				var secondaryRotation = rotation;
			}

            var fighterColor = xolor('#199EC6')
                fighterColor.lightness(.8*fighterColor.lightness())
			var fighter = Fighter(Point(0,distanceFromCenter),secondaryRotation, size, fighterColor);
				fighter.rotateAround(Point(0,0), rotation);
			this.add(fighter)
			this.subShips.push(fighter)
		}
		
		this.radiusIn = this.subShips[0].weapons[0].p().dist(this.p())
	}
	
	this.intersects = function(p, view) {
		return this.p().dist(p) < this.radius()
	}
	this.radius = function() {
		return this.radiusIn //this.size*21;
	}
		
	/*override*/this.update = function(ctx) {
        superclass.update.call(this)
        this.rotate(-2)
    }
		
	/*override*/this.draw = function(ctx) {
        superclass.draw.call(this, ctx)

        if(this.selected) {
            ctx.beginPath();
            ctx.strokeStyle = "#00ff00"
            ctx.arc(this.p().x, this.p().y, this.radius(), 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath()
        }

        var width = 4, height = 4
        var fillStyle = "red" //"#00FFFF"
        drawRect(ctx, fillStyle, width, height, this.p(), this.r())
    }
})

// duration and cooldown are in milliseconds
// color should be an xolor object
export var Weapon = proto(Drawable, function(superclass) {
	this.init = function(p,rot, duration,cooldown,range, size,color) {
		superclass.init.call(this, p, rot);
		
		// private members
		
		this.firingAt = false; 	// is false when it isn't firing
		this.msLeft; 			// the number of milliseconds left - only defined when firingAt is not false
		
		this.lastFired = new Date(0);
		this.cooldown = cooldown;
		this.range = range;
		this.duration = duration;
		this.color = color;
		this.size = size;
		
		this.targets = [];	
	}
	
	this.target = function(p) {
		this.targets.push(p);	
	}
	
	this.update = function(view) {
		var me = this;		
		
		var msSinceLastFired = function() {
			return (new Date()).getTime() - me.lastFired.getTime();
		}
		
		var fire = function() {	// draw a firing event
			me.msLeft = me.duration-msSinceLastFired();
			if(me.msLeft < 0) {
				me.firingAt = false;
				return;	
			}
		};
		
		if(this.firingAt) {
			fire()
		} else if(msSinceLastFired() > this.cooldown) { // can fire again
			for(var n in this.targets) {
				if(this.p().dist(this.targets[n]) < this.range) { // target is in range
					this.firingAt = this.targets[n];
					this.lastFired = new Date();
					fire();
					break; // only shoot at once target at a time	
				}
			}
		}
	}
	
	this.draw = function(ctx) {
        var width = 4, height = 4
        drawRect(ctx, "green", width, height, this.p(), this.r())

        if(this.firingAt && this.duration !== 0) {
            ctx.strokeStyle = this.color.css
            ctx.lineWidth = this.size*(this.msLeft/this.duration)
            ctx.beginPath()
            ctx.moveTo(this.p().x, this.p().y)
            ctx.lineTo(this.firingAt.x, this.firingAt.y)
            ctx.stroke()
            ctx.closePath()
        }
	}
})

export var Line = proto(Drawable, function(superclass) {
	this.init = function(p,rot, width,len,color) {
		superclass.init.call(this, p, rot)
		
	    this.width = width
	    this.len = len
	    this.color = color
	}
		
	this.draw = function(ctx) {
		var p = this.p()
	    var rot = -this.r()
	
	    var lineFactorA = 2.5*this.width
	
	    var start = this.start()
	    var p2 = p.add(this.getPointAngle(-lineFactorA/2, lineFactorA, rot))
	    var p3 = p.add(this.getPointAngle( lineFactorA/2, lineFactorA, rot))
	    var end = this.end()

        // Cubic Bézier curve
        ctx.strokeStyle = this.color.css
        ctx.lineWidth = this.width
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.bezierCurveTo(p2.x, p2.y, p3.x, p3.y, end.x, end.y)
        ctx.stroke()
        ctx.closePath()
	}
	
	this.end = function() {
		return this.getEnd('end')
	}
	this.start = function() {
		return this.getEnd('start')
	}
    
    // private

    // Returns the point at one of the ends
    this.getEnd = function(side) {
		var lenFactor = this.len
		if(side === 'start') lenFactor = -lenFactor
		
		return this.p().add(this.getPointAngle(lenFactor,0,-this.r()))
	}
	
	// what is this? Maybe it gets an angle in Point form somehow?
    this.getPointAngle = function(x,y,rot) {
	    var a = Math.atan2(y,x)
	    var len = Math.max(Math.abs(x),Math.abs(y))
	
	    rot *= Math.PI/180
	    var rotDiff = a-rot
	
	    return Point(Math.cos(rotDiff)*len, Math.sin(rotDiff)*len)
	}
})

function drawRect(ctx, fill, width, height, p, r) {
    ctx.save()
    ctx.fillStyle = fill
    ctx.translate(p.x, p.y)
    ctx.rotate(r*Math.PI/180)
    ctx.beginPath()
    ctx.rect(-width/2, -height/2, width, height)
    ctx.fill()
    ctx.restore()
}
