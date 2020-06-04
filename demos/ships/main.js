import * as View from '../../View'
import * as Drawable from '../../Drawable'
import * as Point from '../../Point'
import * as proto from 'proto'
import * as xolor from 'xolor'

import {Line, Ship, Station, Fighter} from './shipParts.js'

var v = addCanvas(700,700, 20)
createStation(v)
createFighter(v)
//createSomethingElse(v)

function addCanvas(height, width, fps) {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', width+'px')
    canvas.setAttribute('height', height+'px')
    canvas.style.border = '1px solid'
    document.body.append(canvas);
    const renderAll = () => {fabricCanvas.renderAll()}

    const context = canvas.getContext('2d')
    var dpr = window.devicePixelRatio || 1
    context.scale(dpr, dpr)
    const clearCanvas = () => {context.clearRect(0, 0, canvas.width, canvas.height)}
    const registerClickHandler = (handler) => {canvas.addEventListener('click', function(event) {
        var point = Point(event.x, event.y)
        handler(point, event)
    })}

    return View(context, fps, clearCanvas, registerClickHandler)
}

function createStation(v) {
    var ship = Station(Point(400,400),0, 4, undefined);
        ship.click(function() {
            ship.selected = !ship.selected;
        });

        ship.target(Point(200,200));
        ship.target(Point(600,600));
        ship.target(Point(600,200));

    v.add(ship);
}

function createFighter(v4) {
    var f1 = Fighter(Point(50,50),0, /*size*/ 4, xolor('red').lightness(200));
        f1.target(Point(200,200));
        f1.target(Point(600,600));
        f1.target(Point(600,200));
    var f2 = Fighter(Point(100,100),0, /*size*/ 4, xolor('green').lightness(200));
        f2.z(-1)
    v4.add(f1)
    v4.add(f2)
}

function createSomethingElse() {
    var c = xolor("#00FF00");
    console.log(c.lightness());
    console.log(c.lightness(.5).lightness());
    console.log(c.lightness(.01).relLighten(1).lightness());

    var what = xolor('#199EC6').lightness(.7).xc;
    console.log(what.r+", "+what.g+", "+what.b);
}