import * as View from '../../View'
import * as Drawable from '../../Drawable'
import * as Point from '../../Point'
import * as proto from 'proto'

var Square = proto(Drawable, function() {
    // This is a one-time draw function that initializes the object.
    this.draw = function(con) {
        const position = this.p(), degrees = this.r()
        const width = 20, height = 20
        con.fillStyle = 'red';
        con.save()
        con.translate(position.x + width/2, position.y + height/2)
        con.rotate(degrees*Math.PI/180)
        con.fillRect(-width/2, -height/2, width, height)
        con.restore()
    }

//    this.update = function() {
//        this.r(this.r()+1)
//    }
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

var parent = new Rotator(Point(100,100));
parent.add(new Square(Point(20,20)))
v.add(parent)