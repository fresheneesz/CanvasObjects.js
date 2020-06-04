# CanvasObject.js

A canvas view library for drawing objects that can be composed from other object. Is compatible with any shape drawing library.

CanvasObject.js provides a `Drawable` class that can have children `Drawable` objects, which rotate and move with their parent. 

## API

#### `View`

A `View` draws a set of `Drawable`s at a chosen frame rate.

* **`View(con, fps, beforeDraw)`**
* **`con`** - The object that `Drawable`s need to draw with. This can be a context or canvas object, or any object with any API. This will be passed to `Drawables.draw()`.
  * **`fps`** - An integer number of frames per second.
  * **`beforeDraw()`** - *(Optional)* A function called immediately before each frame is drawn. This is a good place to put code for clearing the canvas before drawing the next frame.
  * **`registerClickHandler`** - *(Optional)* A function that registers a click handler on the view, where the handler gets a `Point` object representing where the event landed, and the `event` object itself as the second parameter.


`View`'s drawing phase:

1. Calls `beforeDraw()`.
2. Draws each `Drawable`.
   1. For each `Drawable`, it will call the `draw` method of that drawable,
   2. then it draws each of that `Drawable`'s children (etc recursively) in a depth-first iteration. 
3. Calls the `update` method of each `Drawable`.

#### Drawable

A `Drawable` is something that knows how to draw itself on the canvas and update itself in preparation for the next frame. 

* **`Drawable(relativePosition, relativeRotation, relativeZ)`** 
  * **`relativePosition`** - A `Point` object representing the position of the object from its parent's point of view.
  * **`relativeRotation`** - An integer angle in degrees representing the rotation of the object from its parent's point of view. 
  * **`relativeZ`** - An integer representing draw order relative to its parent. Like the other two values, this will be translated to an absolute value for drawing. Lower absolute numbers will be drawn first, higher numbers will be drawn on top of things with lower numbers. Objects with equal absolute z will be drawn in the order they were added to the `View`.

Getter/setters. All the following methods return a value if the argument is undefined, and set a value if the argument is defined. The types of the arguments correspond to the types used in the constructor. Note that because the absolute values are dependent on the corresponding relative values, changing one will change the other and vice versa.

* **`relp(newRelP)`**  - The current relative **position**.
* **`relr(newRelR)`**  - The current relative **rotation**.
* **`relz(newRelZ)`**  - The current relative **Z** value.
* **`p(newP)`**  - The current absolute **position**.
* **`relr(newR)`**  - The current absolute **rotation**.
* **`relz(newZ)`**  - The current absolute **Z** value.

Abstract methods (should be overridden):

* **`draw(view)`**  - Draws the object.
  * **`view`** - The `View` object to draw on.
* **`update()`**  - Updates information about the object, eg its position, coloring, etc. Update is separate from draw so that the time between beginning of drawing the frame and ending is as short as possible.
* **`intersects(point)`**  - Returns true if `point` intersects with the `Drawable`.

Other methods:

* **`rotate(degrees)`**  - Rotates the `Drawable` a given number of `degrees` around its position.
* **`rotateAround(point, degrees)`**  - Rotates the `Drawable` a given number of `degrees` around a given `point`.
* **`add(drawable1, drawable2, ...)`**  - Adds Drawable objects as children.
* **`freezeAbsoluteAttributes()`**  - Freezes the value of absolute attributes. This is useful to improve performance in cases where the absolute position is being queried repeatedly without being updated (eg during drawing).
* **`unfreezeAbsoluteAttributes()`**  - Unfreezes the value of absolute attributes.
* **`click(handler)`**  - Registers a handler that will be called when the canvas is clicked, and the object is the top-most object that intersects with the click.
* **`clickOver(handler)`**  - Registers a handler that will be called when the canvas is clicked, and the object intersects with the click. All objects that intersect will be called, not just the top-most one.

#### Point

* **`Point(x, y)`** - Returns a new point with the given x and y components.
* **`Point(point)`** - Returns a copy of the passed point.
* **`point.neg()`** - Returns the vector in the opposite direction from the origin.
* **`point.add(b)`** - Returns the result of adding two vectors together.
* **`point.sub(b)`** - Returns the result of subtracting one vector from another.
* **`point.rotateArount(b, degrees)`** - Returns this Point rotated around another Point (clockwise being positive).
* **`point.angleFrom(b, degrees)`** - Returns the direction this Point is from Point p, in angle form (clockwise being positive).
* **`point.dist(b)`** - Returns the distance to the Point p.
* **`point.lt(b)`** - Less than - both coordinates are less than the corresponding coordinates in p. Useful for defining a bounds.
* **`point.gt(b)`** - Greater than - both coordinates are greater than the corresponding coordinates in p.
* **`point.setXY(object, xName, yName)`** - Sets the x and y coordinates of the point with the values of `object[xName]` and `object[yName]`.

## Example

This example is at [demos/simpleDemo](demos/simpleDemo).

```javascript
import * as View from '../View'
import * as Drawable from '../Drawable'
import * as Point from '../Point'
import * as proto from 'proto'
import defaultExport from 'fabric'

var Square = proto(Drawable, function() {
    // This is a one-time draw function that initializes the object.
    this.draw = function(view) {
        const position = this.p();
        view.con.fillStyle = 'red';
        view.con.fillRect(position.x, position.y, 20, 20);
    }
})

var Rotator = proto(Drawable, function() {
    this.update = function() {
        this.r(this.r()+1)
    }
})

function createView(height, width, fps) {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', width+'px')
    canvas.setAttribute('height', height+'px')
    canvas.style.border = '1px solid'
    document.body.append(canvas);

    const context = canvas.getContext('2d')
    const clearCanvas = () => {context.clearRect(0, 0, canvas.width, canvas.height)}

    return View(context, fps, clearCanvas)
}

var v = createView(200,200, 50)

var parent = new Rotator(Point(150,150));
parent.add(new Square(Point(20,20)))
v.add(parent)
```

