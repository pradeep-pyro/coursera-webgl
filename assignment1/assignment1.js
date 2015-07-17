"use strict";
var gl;
var points = [];
var program;
var vertices = [vec2(-(Math.sqrt(3)/2), -0.5),   // bottom left
                vec2(0, 1),                      // top middle
                vec2((Math.sqrt(3)/2), -0.5)     // bottom right
               ];

// Input variables for settings
var angle = 30;
var numDivisions = 3;
var gasket = false;
var style = "wireframe";

window.onload = function init() {

    // register event handlers
    document.getElementById('settings').addEventListener('change', update);

    var canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL(canvas);
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    // setup OpenGL viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    update();

    // perform subdivision and push vertices to points
    subdivide(numDivisions);

    // twist points
    rotate(angle);
}

function update() {
    if (document.getElementById('gasket').checked) {
        gasket = true;
    } else {
        gasket = false;
    }

    if (document.getElementById('solid').checked) {
        style = "solid";
    } else {
        style = "wireframe";
    }

    angle = parseInt(document.getElementById('angleValue').value);
    numDivisions = parseInt(document.getElementById('divisionValue').value);

    subdivide(numDivisions);
    rotate(angle);

}

function render() {
	gl.clearColor(0, 0, 0, gl.COLOR_BUFFER_BIT);
    
    if (style === "solid") {
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }
    if (style === "wireframe") {
        for (var i=0; i<points.length; i+=3) {
            gl.drawArrays( gl.LINE_LOOP, i, 3);
        }
    }
}

function subdivide(numDivisions) {
    points = [];
    subdivideTriangle(vertices[0], vertices[1], vertices[2], numDivisions);  
}

function subdivideTriangle(a, b, c, count) {
    if (count === 0) {
        points.push(a, b, c);
    }
    else{
        var ab = mix(a, b, 0.5);
        var bc = mix(b, c, 0.5);
        var ca = mix(c, a, 0.5);
        subdivideTriangle(a, ab, ca, count-1);
        subdivideTriangle(ab, b, bc, count-1);
        subdivideTriangle(ca, bc, c, count-1);
        if (!gasket) {
            subdivideTriangle(bc, ca, ab, count-1);
        }
    }
}

function rotate(angle) {
    var theta = (Math.PI / 180) * angle;
    var rotatedPoints = points.map(
        function(v) {
            return rotateVertex(v, theta);
        }
    );
    updateBuffer(rotatedPoints);
    render();
}

function updateBuffer(pts) {
    // load vertex data to GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pts), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition); 

}

function rotateVertex(pt, theta) {
    var x = pt[0];
    var y = pt[1];
    var d = Math.sqrt(x*x + y*y);
    var nx = x*Math.cos(d*theta) - y*Math.sin(d*theta);
    var ny = x*Math.sin(d*theta) + y*Math.cos(d*theta);
    return vec2(nx, ny);
}
