const proto = require('proto')

// A View object that can draw 2D objects using raw canvas or any other drawing library.
module.exports = proto(function() {

    // con - Any kind of initialized canvas or context object with any API.
    // fps - The desired frames per second.
    // beforeDraw - If this is set, it will be called as a function immediately before drawing each frame. This is a
    //     good place to put a function for clearing the canvas.
    // registerClickHandler(point, handler) - Registers a click handler on the view, where the handler gets an event
	this.init = function(con, fps, beforeDraw, registerClickHandler) {
		this.con = con
        this.beforeDraw = beforeDraw
		
		this.drawLoop(fps)
		
		// private members

		this.drawables = []
        this.clickTargets = []
        this.clickOverTargets = []
        this.clickTargetsInOrder = false
        this.clickOverTargetsInOrder = false
        this.clickHandlingSupported = false

        if(registerClickHandler) {
            registerClickHandler(function(point, event) {
                this.handleClickTargets('clickOverTargets', 'clickOverTargetsInOrder', point, event)
                this.handleClickTargets('clickTargets', 'clickTargetsInOrder', point, event)
            }.bind(this))
            this.clickHandlingSupported = true
        }

	}

    // Adds one or more Drawables to the View.
    this.add = function(/*drawable1, ... */) {
        var args = Array.prototype.slice.call(arguments);
        for(var n in args) {
            this.drawables.push(args[n])
            attachDrawable.call(this, args[n])
        }
        return this

        // Detaches a drawable and its descendants
        function attachDrawable(drawable) {
            drawable.attach(this)
            drawable.children.forEach(function(child) {
                attachDrawable.call(this, child)
            })
        }
    }

    // Removes one or more Drawables to the View.
    this.remove = function(/*drawable1, ... */) {
        var args = Array.prototype.slice.call(arguments);
        for(var n in args) {
            var index = this.drawables.indexOf(args[n])
            if(index !== -1) {
                this.drawables.splice(index, 1)
                detachDrawable.call(this, args[n])
            }
        }
        return this

        // Detaches a drawable and its descendants
        function detachDrawable(drawable) {
            drawable.detach(this)
            drawable.children.forEach(function(child) {
                detachDrawable.call(this, child)
            })
        }
    }

	// private methods

	this.drawLoop = function(fps) {
		if(this.drawLoopStarted === undefined) {
            this.drawLoopStarted = true
		} else {
            loopFunction.call(this)
            return
        }
		
		function loopFunction() {
            this.clickTargetsInOrder = false
            this.clickOverTargetsInOrder = false
            var drawOrder = this.buildOrderedDrawlist(this.drawables)

            if(this.beforeDraw) this.beforeDraw();
            this.draw(drawOrder); // I want to put this before update, but right now it causes the first frame to blip - figure out how to fix that

            this.update(drawOrder);
		}
		
		loopFunction.call(this);
		setInterval(loopFunction.bind(this), 1000/fps)
	}

    // Runs 'update' on all drawables and their children.
    this.update = function(drawables) {
        var me = this
        drawables.forEach(function(drawable) {
            drawable.update(me.con)
            me.update(drawable.children)
        })
    }

    // Runs 'draw' on all drawables and their children.
    this.draw = function(drawables) {
        var me = this
        drawables.forEach(function(drawable) {
            drawable.draw(me.con)
        })
    }

    // Returns a list of drawables ordered by their intended draw order.
    this.buildOrderedDrawlist = function(drawables) {
        var drawablesMap = {}
        var addToDrawablesMap = function(drawable) {
            var z = drawable.z()
            if(drawablesMap[z] === undefined) drawablesMap[z] = []
            drawablesMap[z].push(drawable)
            drawable.children.forEach(function(child) {
                addToDrawablesMap(child)
            })
        }

        for(var n in drawables) { var d = drawables[n]
            // Freeze position and rotation (for performance reasons, to avoid redundant calculations).
            d.freezeAbsoluteAttributes()

            addToDrawablesMap(d) //d.draw(this);
            this.buildOrderedDrawlist(d.children, drawablesMap) //draw(d.children);

            // Unfreeze.
            d.unfreezeAbsoluteAttributes()
        }

        var keys = []
        for(key in drawablesMap) { // get keys
            keys.push(Number(key))
        }

        keys.sort()

        // Loop through Drawables in z-index order.
        var drawOrder = []
        for(var n in keys) { var key=keys[n]
            for(var m in drawablesMap[key]) {
                drawOrder.push(drawablesMap[key][m])
            }
        }

        return drawOrder
    }

    this.on = function(event, object, handler) {
        if(!this.clickHandlingSupported) {
            throw new Error("Handling clicks unsupported (pass in a 4th parameter to View's contructor to support it).")
        }

        if(event === 'click') {
            var handlersMemberName = 'clickTargets'
        } else if(event === 'clickOver') {
            var handlersMemberName = 'clickOverTargets'
        } else {
            throw new Error("Attempted listening on unknown event '"+event+"'.")
        }

        this[handlersMemberName].push({handler: handler, object: object, children: [], d: function() {
            return object.d()
        }, z: function() {
            return object.z()
        }, freezeAbsoluteAttributes: function() {
            object.freezeAbsoluteAttributes()
        }, unfreezeAbsoluteAttributes: function() {
            object.unfreezeAbsoluteAttributes()
        }})
    }

    this.off = function(event, object, handler) {
        if(event === 'click') {
            var handlersMemberName = 'clickTargets'
        } else if(event === 'clickOver') {
            var handlersMemberName = 'clickOverTargets'
        }

        var infoObjects = this[handlersMemberName]
        for(var n=0; n<infoObjects; n++) {
            if(infoObjects[n].handler === handler) {
                infoObjects.splice(n,1)
                break
            }
        }
    }

    // targetsMemberName - The name of the member that lists Drawables to go through as click targets
    // inOrderMemberName - The name of the member keeping track of whether the click targets are in order or not.
    this.handleClickTargets = function(targetsMemberName, inOrderMemberName, point, event) {
        if(!this[inOrderMemberName]) {
            this[targetsMemberName] = this.buildOrderedDrawlist(this[targetsMemberName])
            this[inOrderMemberName] = true
        }
        var orderedTargets = this[targetsMemberName]
        for(var n=0; n<orderedTargets.length; n++) {
            var info = orderedTargets[n]
            if(info.object.intersects(point)) {
                info.handler.call(info.object, point, event)
//                chainTriggerAncestors(info.object, point, event)
//                // If this is a click target and not a clickOver target, bubble the event up through ancestors.
//                if(orderedTargets === this.clickTargets) {
//                    for(var j=0; j<orderedTargets; j++) {
//                        if(orderedTargets[j].object === info.object.parent) {
//                            orderedTargets[j].handler.call(orderedTargets[j].object, point, event)
//                        }
//                    }
//                    break
//                }
            }
        }

        function chainTriggerAncestors(object, point, event) {
            if(info.handler.call(info.object, point, event) !== false) {
                chainTriggerAncestors(info.object.parent, point, event)
            }
        }
    }
})
