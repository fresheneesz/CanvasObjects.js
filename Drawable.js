const proto = require('proto')
const Point = require('./Point')

// An abstract class that has drawing functions.
// Requires definition of:
// * draw(view)
// * update()
// * intersects(point)
module.exports = proto(function() {

	this.init = function(relativePosition, relativeRotation, relativeZ) {
    	if(relativeZ == undefined) relativeZ=1	// Default to being in front of parent.

		// private members
		
    	this.relp_ = relativePosition || Point(0,0)
		this.relr_ = relativeRotation || 0
		this.relz_ = relativeZ

        // Start unfrozen.
        this.unfreezeAbsoluteAttributes()

        // This Drawable starts as an orphan with a fake parent :( - it also can only have maximum one parent :(
		this.parent = {
			p: function() { return Point(0,0) },
			r: function() { return 0 },
			z: function() { return 0 }
		}
    	this.children = []
        this.attachedViews = new Set
        this.clickHandlers = new Set
        this.clickOverHandlers = new Set
	}

    // Instance methods
	
	// Abstract method defaults

    // Draws the object.
    // view - The View object.
    this.draw = function(view) { }

    // Updates information about the object, eg its position, coloring, etc. Does not draw anything about the object.
    // Update is separate from draw so that the time between beginning of drawing the frame and ending is as short as possible.
    this.update = function() {/*nothing*/}

    // Returns true if 'point' intersects with the Drawable.
    this.intersects = function(point) { return false }
	
	// Public methods.

    // Getters/setters.

    // Position relative to its parent.
    this.relp = getterSetter('relp_')
    // Rotation relative to its parent.
    this.relr = getterSetter('relr_')
    // Z relative to its parent.
    this.relz = getterSetter('relz_')

    // Absolute position.
    this.p = function(newAbsolutePosition) {
        if(newAbsolutePosition !== undefined) {
            this.relp_ = relativePositionFromParent(newAbsolutePosition, this.parent)
        } else if(this.positionOverride !== null) {
            return this.positionOverride
        } else {
            return absolutePositionWithParent(this, this.parent)
        }
    }
    // Absolute rotation in degrees.
    this.r = function(newAbsoluteRotation) {
        if(newAbsoluteRotation !== undefined) {
            this.relr_ = newAbsoluteRotation - this.parent.r()
        } else if(this.rotationOverride !== null) {
            return this.rotationOverride
        } else {
            return this.relr_ + this.parent.r()
        }
    }
    // Absolute z value.
    this.z = function(newAbsoluteZ) {
        if(newAbsoluteZ !== undefined) {
            this.relz_ = newAbsoluteZ -this.parent.z()
        } else if(this.zOverride !== null) {
            return this.zOverride
        } else {
            return this.relz_ + this.parent.z()
        }
    }

    // Other public methods.

	// Rotates the Drawable around its position.
    this.rotate = function(deg) {
	    this.relr_ += deg
		return this // for chaining
	}

    // Rotates the Drawable around a given point 'p'.
	this.rotateAround = function(p, deg) {
		this.relp_ = this.relp_.rotateAround(p, deg)
		this.rotate(deg) // must be after this object's position is rotated around because Point.rotate depends on this.p that is changed above
						
		return this; // for chaining
	}

    // Adds Drawable objects as children.
    this.add = function(/*drawable1, ... */) {
        var args = Array.prototype.slice.call(arguments)
        for(var n in args) {
            this.children.push(args[n])
            args[n].parent = this
        }
        return this // chaining
    }

    // Freezes the value of absolute attributes.
    // This is done temporarily in order to avoid redundant calculations, for example, while drawing.
    this.freezeAbsoluteAttributes = function(){
        this.positionOverride = this.p()
        this.rotationOverride = this.r()
        this.zOverride = this.z()
    }

    // Unfreezes the value of absolute attributes.
    this.unfreezeAbsoluteAttributes = function() {
        this.positionOverride = null
        this.rotationOverride = null
        this.zOverride = null
    }
	
    // Listens for when the mouse clicks over the object, regardless of whether or not another object is above it or not.
    this.clickOver = function(handler) {
        this.clickOverHandlers.add(handler)
        this.attachedViews.forEach(function(view) {
            view.on('clickOver', this, handler)
        }.bind(this))
        return this // for chaining
    }
	
    this.click = function(handler) {
        this.clickHandlers.add(handler)
        this.attachedViews.forEach(function(view) {
            view('click', this, handler)
        }.bind(this))
        return this // for chaining
    }

    // private

    // Attach to a view.
    this.attach = function(view) {
        this.attachedViews.add(this)
        this.clickOverHandlers.forEach(function(handler) {
            view.on('clickOver', this, handler)
        }.bind(this))
        this.clickHandlers.forEach(function(handler) {
            view.on('click', this, handler)
        }.bind(this))
    }

    // Attach to a view.
    this.detach = function(view) {
        this.attachedViews.delete(this)
        this.clickOverHandlers.forEach(function(handler) {
            view.off('clickOver', this, handler)
        }.bind(this))
    }
})


// Creates a getter/setter, where if a value is passed in, it sets the value, otherwise it returns the current value.
function getterSetter(memberName) {
    return function(newValue) {
        if(newValue !== undefined)
            this[memberName] = newValue
        else
            return this[memberName]
    }
}

// static methods

// Returns the absolute position of 'drawable' using 'parent' as its parent.
function absolutePositionWithParent(drawable, parent) {
    var parentPosition = parent.p()
    var unrotatedAbsolutePosition = drawable.relp().add(parentPosition)
    return unrotatedAbsolutePosition.rotateAround(parentPosition, parent.r())
}

// Returns the relative position of 'point' using 'parent' as the origin.
// basically the inverse of absolutePositionFromParent
function relativePositionFromParent(point, parent) {
    var parentPosition = parent.p()
    var unrotatedAbsolutePosition = point.rotateAround(parentPosition, -parent.r())
    return unrotatedAbsolutePosition.sub(parentPosition)
}