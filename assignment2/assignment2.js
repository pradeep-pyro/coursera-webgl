"use strict";
var gl;
var program;
var drawing = false;
var pts = []
var cols = []
var canvas;
var initBufferSize = 10000;
var start_indices = [];

// GPU buffers
var vBuffer;
var cBuffer;

// input variables
var inColor = "#ff0000";

function updateSettings() {
    inColor = document.getElementById("lineColor").value;
    console.log(inColor);
}

function drawStrokes(evt) {
    if (drawing) {
        var new_pt = relPosToNDC(getRelPos(evt))
        var new_col = hexToRGB(inColor);
        pts.push(new_pt);
        cols.push(new_col);
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
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, initBufferSize, gl.DYNAMIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
 
    // Load an empty color buffer onto the GPU
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, initBufferSize, gl.DYNAMIC_DRAW);
    var vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}

function updateBuffer() {
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(pts));
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(cols));
}

window.onload = function init() {
    // setup WebGL
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL(canvas);
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    // register event handlers
    document.getElementById('settings').addEventListener('change', updateSettings);
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

// http://www.javascripter.net/faq/hextorgb.htm
function cutHex(h) {
    return (h.charAt(0)=="#") ? h.substring(1,7):h;
}
function hexToRGB(h) {
    var g = parseInt((cutHex(h)).substring(2,4),16)/255;
    var b = parseInt((cutHex(h)).substring(4,6),16)/255;
    var r = parseInt((cutHex(h)).substring(0,2),16)/255;
    console.log(r, g, b);
    return vec3(r, g, b);
}