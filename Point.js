const proto = require('proto')

// Represents an x,y coordinate or vector.
const Point = module.exports = proto(function() {
	this.init = function(/* Point or x,y */) {
		var args = arguments;			
		if(args.length == 1) {
			this.x = args[0].x;
			this.y = args[0].y;	
		} else { // args.length == 2
			this.x = args[0];
			this.y = args[1];
		}	
	}
	
	// Returns the vector in the opposite direction from the origin.
	this.neg = function() {
		return Point(-this.x, -this.y);
	}
	// Returns the result of adding two vectors together.
	this.add = function(b) {
		return Point(this.x+b.x, this.y+b.y);
	}
	// Returns the result of subtracting one vector from another.
	this.sub = function(b) {
		return this.add(b.neg());	
	}
	
	// Less than - both coordinates are less than the corresponding coordinates in p.
	// Useful for defining a bounds.
	this.lt = function(p) {
		return this.x < p.x && this.y < p.y;	
	}
	// Greater than - both coordinates are greater than the corresponding coordinatesin p.
	this.gt = function() {
		return this.x > p.x && this.y > p.y;
	}
	
	// Returns this Point rotated around another Point (clockwise being positive).
	this.rotateAround = function(p, deg) {
		var angle = this.angleFrom(p);
		var distance = this.dist(p);
		var posrotRadians =  angle + deg*Math.PI/180;
		
		return Point(p.x+Math.cos(posrotRadians)*distance, p.y+Math.sin(posrotRadians)*distance)
	}
	
	// Returns the direction this Point is from Point p, in angle form (clockwise being positive).
	this.angleFrom = function(p) {
		var difference = this.sub(p);	
		return Math.atan2(difference.y,difference.x);
	}
	
	// Returns the distance to the Point p.
	this.dist = function(p) {
		var difference = this.sub(p);
		return Math.sqrt(Math.pow(difference.x,2)+Math.pow(difference.y,2));	// h = (x^2+y^2)^.5
	}
	
	// Sets x and y coordinates on an object.
	// xName and yName default to 'x' and 'y' respectively.
	this.setXY = function(object, xName, yName) {
    if(xName === undefined) xName = 'x'
    if(yName === undefined) yName = 'y'
		object[xName] = this.x;
		object[yName] = this.y;
	}
})
