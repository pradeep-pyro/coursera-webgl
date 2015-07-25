"use strict";
var gl;
var vbuffer;
var program;
var drawing = false;
var pts = []
var canvas;
var initBufferSize = 2000;
var start_indices = [];

function getRelPos(evt) {
    if (evt.offsetX !== undefined && evt.offsetY !== undefined) {
        return vec2(evt.offsetX, evt.offsetY);
    } else {
        return vec2(evt.layerX, evt.layerY);
    }
}

function relPosToNDC(pos) {
    var cx = (2*pos[0]/canvas.width)-1;
    var cy = (2* (canvas.height-pos[1])/ canvas.height)-1;
    return vec2(cx, cy);
}

function drawStrokes(evt) {
    if (drawing) {
        var new_pt = relPosToNDC(getRelPos(evt))
        pts.push(new_pt);
        updateBuffer();
        render();
    }
}

function render() {
    gl.clearColor(0, 0, 0, gl.COLOR_BUFFER_BIT);
    if (pts.length === 0) {
        return
    }
    for (var i=0; i<start_indices.length-1; i++) {
        var start = start_indices[i];
        var end = start_indices[i+1];
        if (end-start <= 0) {
            return
        }
        gl.drawArrays(gl.LINE_STRIP, start, end-start);
    }
    start = start_indices[start_indices.length-1];
    end = pts.length;
    if (end-start <= 0) {
        return
    }
    gl.drawArrays(gl.LINE_STRIP, start, end-start);
}

function initBuffer() {
    vbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, initBufferSize, gl.DYNAMIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    updateBuffer();
}

function updateBuffer() {
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(pts));
}

window.onload = function init() {
    // setup WebGL
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL(canvas);
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    // register event handlers
    canvas.addEventListener('mousedown', function(event) {
        start_indices.push(pts.length);
        drawing = true;
    });
    canvas.addEventListener('mouseup', function(event) {
        drawing = false;
    });
    canvas.addEventListener('mousemove', drawStrokes);

    // setup OpenGL viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    initBuffer();
    
    render();
}