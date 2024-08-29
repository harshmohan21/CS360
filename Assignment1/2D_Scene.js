////////////////////////////////////////////////////////////////////////
// A simple WebGL program to draw simple 2D shapes with animation.
//
var gl;
var color;
var matrixStack = [];

// mMatrix is called the model matrix, transforms objects
// from local object space to world space.
var mMatrix = mat4.create();
var uMMatrixLocation;

var aPositionLocation;
var uColorLoc;

var animation;

// for back and forth motion of the boat
let translationX = 0.0;
const translationSpeed = 0.003;
translationRange = 0.7;
let direction = 1;

// for rotation of the windmill and sun
let rotationAngle = 0.0;
const rotationSpeed = 0.02;

// for drawing the circle
const numSegments = 100; // Number of segments for the circle
const angleIncrement = (Math.PI * 2) / numSegments;

var mode = 's';  // mode for drawing

//same only gl_point_size = 5.0;
const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
  gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
  gl_PointSize = 10.0;
}`;

//same
const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;

uniform vec4 color;

void main() {
  fragColor = color;
}`;

//same
function pushMatrix(stack, m) {
  //necessary because javascript only does shallow push
  var copy = mat4.create(m);
  stack.push(copy);
}

//same
function popMatrix(stack) {
  if (stack.length > 0) return stack.pop();
  else console.log("stack has no matrix to pop!");
}

//same
function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}


//same
function vertexShaderSetup(vertexShaderCode) {
  shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, vertexShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

//same
function fragmentShaderSetup(fragShaderCode) {
  shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(shader, fragShaderCode);
  gl.compileShader(shader);
  // Error check whether the shader is compiled correctly
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

//same
function initShaders() {
  shaderProgram = gl.createProgram();

  var vertexShader = vertexShaderSetup(vertexShaderCode);
  var fragmentShader = fragmentShaderSetup(fragShaderCode);

  // attach the shaders
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  //link the shader program
  gl.linkProgram(shaderProgram);

  // check for compilation and linking status
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  //finally use the program.
  gl.useProgram(shaderProgram);

  return shaderProgram;
}

//same
function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2"); // the graphics webgl2 context
    gl.viewportWidth = canvas.width; // the width of the canvas
    gl.viewportHeight = canvas.height; // the height
  } catch (e) {}
  if (!gl) {
    alert("WebGL initialization failed");
  }
}

//same
function initSquareBuffer() {
  // buffer for point locations
  const sqVertices = new Float32Array([
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);
  sqVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
  sqVertexPositionBuffer.itemSize = 2;
  sqVertexPositionBuffer.numItems = 4;

  // buffer for point indices
  const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  sqVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
  sqVertexIndexBuffer.itemsize = 1;
  sqVertexIndexBuffer.numItems = 6;
}


//same
function drawSquare(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
  gl.vertexAttribPointer(
    aPositionLocation,
    sqVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  gl.drawElements(
    gl.TRIANGLES,
    sqVertexIndexBuffer.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

function initTriangleBuffer() {
  // buffer for point locations
  const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  triangleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
  triangleBuf.itemSize = 2;
  triangleBuf.numItems = 3;

  // buffer for point indices
  const triangleIndices = new Uint16Array([0, 1, 2]);
  triangleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
  triangleIndexBuf.itemsize = 1;
  triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
  gl.vertexAttribPointer(
    aPositionLocation,
    triangleBuf.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);

  gl.uniform4fv(uColorLoc, color);

  // now draw the square
  gl.drawElements(
    gl.TRIANGLES,
    triangleIndexBuf.numItems,
    gl.UNSIGNED_SHORT,
    0
  );
}

function initCircleBuffer() {
  // buffer for point locations
  const positions = [0, 0]; // take the center of the circle
  
  for (let i = 0; i < numSegments; i++) {
    const angle = angleIncrement * i;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y);
  }

  const circleVertices = new Float32Array(positions);
  circleBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);
  circleBuf.itemSize = 2;
  circleBuf.numItems = numSegments + 1;

  // Create index buffer
  const indices = [0, 1, numSegments];
  for (let i = 0; i < numSegments; i++) {
    indices.push(0, i, i + 1);
  }

  // buffer for point indices
  const circleIndices = new Uint16Array(indices);
  circleIndexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, circleIndices, gl.STATIC_DRAW);
  circleIndexBuf.itemsize = 1;
  circleIndexBuf.numItems = indices.length;
}

function drawCircle(color, mMatrix) {
  gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

  // buffer for point locations
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
  gl.vertexAttribPointer(aPositionLocation, circleBuf.itemSize, gl.FLOAT, false, 0, 0);

  // buffer for point indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
  gl.uniform4fv(uColorLoc, color);

  // now draw the circle
  if (mode === 's') {
      gl.drawElements(gl.TRIANGLES, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  }
  else if (mode === 'w') {
      gl.drawElements(gl.LINE_LOOP, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  }
  else if (mode === 'p') {
      gl.drawElements(gl.POINTS, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
  }
}

////////////////////////////////////////////////////////////////////////


/////////////////        SAME CODE TILL HERE //////////////////////////////////


///////////////////////////////////////////////////////////////////////

function drawSun() {
  // Draw the sun (circle)
  mat4.identity(mMatrix);
  
  pushMatrix(matrixStack, mMatrix);
  const sunColor = [0.85, 0.9, 0.9, 0.4];
  mMatrix = mat4.translate(mMatrix, [-0.7, 0.84, 0]);
  mMatrix = mat4.scale(mMatrix, [0.1, 0.1, 1.0]);
  drawCircle(sunColor, mMatrix);
  mMatrix = popMatrix(matrixStack);

  const numRays = 8;      // Number of rays

  for (let i = 0; i < numRays; i++) {
      mat4.identity(mMatrix);
      pushMatrix(matrixStack, mMatrix);
      const angle = (i * 2 * Math.PI) / numRays; // Angle for each ray
      mMatrix = mat4.translate(mMatrix, [-0.7, 0.84, 0]); // Move to sun's center
      mMatrix = mat4.rotate(mMatrix, rotationAngle+ angle, [0, 0, 1]);  // Rotate to the correct angle
      mMatrix = mat4.translate(mMatrix, [0.1, 0, 0]);    // Move to the edge of the sun
      mMatrix = mat4.scale(mMatrix, [0.08, 0.003, 1.0]); // Scale to form a ray
      // mMatrix = mat4.rotate(mMatrix,rotationAngle, [0, 0, 1]); // Rotate to the correct
      drawSquare(sunColor, mMatrix);  // Draw the ray
      mMatrix = popMatrix(matrixStack);
  }
}

function drawSky() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];  // sky blue colour
    // local translation operation for the square
    mMatrix = mat4.translate(mMatrix, [0.0, 0.6, 0]);
    // local scale operation for the square
    mMatrix = mat4.scale(mMatrix, [3.0, 1.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawGround() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.15, 0.8, 0, 0.7];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 1.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawStar(tx,ty,scale)
{
    mat4.identity(mMatrix);
    mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
    mMatrix = mat4.scale(mMatrix, [scale, scale, 1.0])
    color = [1.0, 1.0, 1.0, 1.0];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.2, 0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(90), [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.014, 0.06 , 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.234, 0.77, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(180), [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.014, 0.06 , 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.268, 0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, degToRad(270), [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.014, 0.06 , 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.234, 0.83, 0]);
    mMatrix = mat4.rotate(mMatrix, 0, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.014, 0.06 , 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}


function drawRiver() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0.8, 0.8];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.1, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 0.25, 0.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.2, 0.6, 1, 0.8];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.03, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.005, 0.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.2, 0.6, 1, 0.8];
    mMatrix = mat4.translate(mMatrix, [-0.6, -0.12, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.005, 0.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.2, 0.6, 1, 0.8];
    mMatrix = mat4.translate(mMatrix, [0.6, -0.20, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.005, 0.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

}

function drawTrees(tx,ty,sx,sy,) {
  // initialize the model matrix to identity matrix
  mat4.identity(mMatrix);
  // Apply translation and scaling for the entire tree
  mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
  mMatrix = mat4.scale(mMatrix, [sx, sy, 1.0])
    // stem of the tree
    pushMatrix(matrixStack, mMatrix);
    color = [0.57, 0.36, 0.15, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.50, 0.205, 0]);
    mMatrix = mat4.scale(mMatrix, [0.05, 0.32, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.10, 0.41, 0, 0.9];
  mMatrix = mat4.translate(mMatrix, [0.50, 0.515, 0]);
  mMatrix = mat4.scale(mMatrix, [0.385, 0.33, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.30, 0.51, 0, 0.85];
  mMatrix = mat4.translate(mMatrix, [0.50, 0.565, 0]);
  mMatrix = mat4.scale(mMatrix, [0.4125, 0.33, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.20, 0.50, 0, 0.75];
  mMatrix = mat4.translate(mMatrix, [0.50, 0.615, 0]);
  mMatrix = mat4.scale(mMatrix, [0.44, 0.33, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

}

function drawMountain(tx, ty, sx, sy) {

    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.57, 0.36, 0.15, 1.0];
    mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
    mMatrix = mat4.scale(mMatrix, [sx, sy, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

}
function drawMountShadow( tx , ty ,sx, sy  ){
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.65, 0.46, 0.16, 1.0];
    mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.5, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [sx, sy, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawPath(){


    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    const color = [0.3, 0.5, 0, 0.7]; 

    const angleDeg = 50;  
    const angleRad = degToRad(angleDeg);  

    mMatrix = mat4.translate(mMatrix, [1.0, -1, 0]);

    mMatrix = mat4.rotate(mMatrix, degToRad(70), [0, 0, 1]);
    const shearMatrix = mat4.create();
    mat4.identity(shearMatrix);
    shearMatrix[1] = Math.tan(angleRad);  

    mMatrix = mat4.multiply(mMatrix, shearMatrix, mMatrix);

    mMatrix = mat4.scale(mMatrix, [0.8, 1.9, 1.0]);

    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawHut()
{
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [0.7,0.13,0]);
  mMatrix = mat4.scale(mMatrix, [1.7,1.6,0]);
  pushMatrix(matrixStack, mMatrix);
  color = [1, 0, 0, 1]; 
  
  mMatrix = mat4.translate(mMatrix, [-0.70, -0.24, 0]);

  mMatrix = mat4.scale(mMatrix, [0.25, 0.1, 1.0]);
  const shearMatrix = mat4.create();
  mat4.identity(shearMatrix);
  
  shearMatrix[7] = 0.8;  
  console.log(shearMatrix)
  
  mat4.multiply(mMatrix, shearMatrix, mMatrix);
  console.log("Final transformation matrix:", mMatrix);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  
  pushMatrix(matrixStack, mMatrix);
  color = [1, 1, 0.6, 1]; 
  mMatrix = mat4.translate(mMatrix, [-0.70, -0.41, 0]);
  mMatrix = mat4.scale(mMatrix, [0.34, 0.17, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [1,0.85, 0, 1]; 
  mMatrix = mat4.translate(mMatrix, [-0.70, -0.44, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.11, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [1,0.85, 0, 1]; 
  mMatrix = mat4.translate(mMatrix, [-0.80, -0.37, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.05, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [1,0.85, 0, 1]; 
  mMatrix = mat4.translate(mMatrix, [-0.60, -0.37, 0]);
  mMatrix = mat4.scale(mMatrix, [0.05, 0.05, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

}
function drawBush(tx, ty, sx,sy){

  mat4.identity(mMatrix);
    // Apply translation and scaling for the entire tree

    mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
    mMatrix = mat4.scale(mMatrix, [sx, sy, 1.0])




  pushMatrix(matrixStack, mMatrix);
  color = [0, 0.4, 0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0.2, -1.03, 0]);
  mMatrix = mat4.scale(mMatrix, [0.13, 0.09, 1.0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.2, 0.7, 0,0.9];
  mMatrix = mat4.translate(mMatrix, [-0.3, -1.08, 0]);
  mMatrix = mat4.scale(mMatrix, [0.14, 0.07, 1.0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.3, 0.7, 0, 1]
  mMatrix = mat4.translate(mMatrix, [-0.08, -1.03, 0]);
  mMatrix = mat4.scale(mMatrix, [0.25, 0.14, 1.0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

}

function drawCloud(){

  mat4.identity(mMatrix);
    // Apply translation and scaling for the entire tree
    pushMatrix(matrixStack, mMatrix);
    color = [0.55, 0.55, 0.55, 0.8]
    mMatrix = mat4.translate(mMatrix, [-0.85, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.23, 0.11, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.85, 0.9, 0.9, 0.7];
  mMatrix = mat4.translate(mMatrix, [-0.64, 0.52, 0]);
  mMatrix = mat4.scale(mMatrix, [0.17, 0.09, 1.0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.55, 0.55, 0.55,0.8];
  mMatrix = mat4.translate(mMatrix, [-0.45, 0.52, 0]);
  mMatrix = mat4.scale(mMatrix, [0.10, 0.06, 1.0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);



}

function drawWheel( tx = 0 , ty=0 ) {
  // initialize the model matrix to identity matrix
  mat4.identity(mMatrix);
  mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);

  pushMatrix(matrixStack, mMatrix);
  color = [0, 0, 0, 0.8];
  mMatrix = mat4.translate(mMatrix, [-0.51, -0.86, 0]);
  mMatrix = mat4.scale(mMatrix, [0.04, 0.04, 1.0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.45, 0.45, 0.45, 1];
  mMatrix = mat4.translate(mMatrix, [-0.51, -0.86, 0]);
  mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]);
  drawCircle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function drawCar() {
  // initialize the model matrix to identity matrix
  mat4.identity(mMatrix);
  pushMatrix(matrixStack, mMatrix);
  Color = [0, 0, 1,0.7];
  mMatrix = mat4.translate(mMatrix, [-0.4, -0.72, 0]);
  mMatrix = mat4.scale(mMatrix, [0.14, 0.085, 1.0]);
  drawCircle(Color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0.85, 0.9, 0.9, 1];
  mMatrix = mat4.translate(mMatrix, [-0.4, -0.72, 0]);
  mMatrix = mat4.scale(mMatrix, [0.17, 0.1, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

    // drawing wheels
    drawWheel(0,0);
    drawWheel(0.225,0);

  mat4.identity(mMatrix);
  pushMatrix(matrixStack, mMatrix);
  color = [0.3, 0.6, 1, 1]; 
  
  mMatrix = mat4.translate(mMatrix, [-0.4, -0.78, 0]);

  mMatrix = mat4.scale(mMatrix, [0.38, 0.1, 1.0]);
  const shearMatrix = mat4.create();
  mat4.identity(shearMatrix);
  
  shearMatrix[7] = 0.25;  
  console.log(shearMatrix)
  
  mat4.multiply(mMatrix, shearMatrix, mMatrix);
  console.log("Final transformation matrix:", mMatrix);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);
}

function drawWindmill(tx,ty,sx,sy) {
  mat4.identity(mMatrix);

  mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
  mMatrix = mat4.scale(mMatrix, [sx, sy, 1.0])
  // Draw the stem of the windmill
  pushMatrix(matrixStack, mMatrix);
  color = [0.2, 0, 0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0.7, -0.25, 0]);
  mMatrix = mat4.scale(mMatrix, [0.04, 0.55, 1.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);



  // Draw the blades
  const numberOfBlades = 4;
  const angleStep = 360 / numberOfBlades;

  for (let i = 0; i < numberOfBlades; i++) {
      pushMatrix(matrixStack, mMatrix);
      color = [0.8, 0.65, 0.3, 1.0];

      // Translate to the center of the windmill
      mMatrix = mat4.translate(mMatrix, [0.7, 0.053, 0]);

      // Rotate for each blade
      mMatrix = mat4.rotate(mMatrix, rotationAngle+ degToRad(i * angleStep-15), [0, 0, 1]);

      // Scale to form an isosceles triangle with the vertex at the center
      mMatrix = mat4.scale(mMatrix, [0.09, 0.28, 1.0]);

      // Translate so the vertex of the triangle is at the center
      mMatrix = mat4.translate(mMatrix, [0, -0.5, 0]);

      drawTriangle(color, mMatrix);
      mMatrix = popMatrix(matrixStack);
  }
    // Draw the central circle
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0.7, 0.053, 0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawBoat(tx,ty,sx,sy){
  mat4.identity(mMatrix);
  
  mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
  mMatrix = mat4.scale(mMatrix, [sx, sy, 1.0])

  pushMatrix(matrixStack, mMatrix);
  color = [0.87, 0, 0, 1.0];
  mMatrix = mat4.translate(mMatrix, [0.83, 0.08, 0]);
  mMatrix = mat4.rotate(mMatrix ,degToRad(-90) , [0,0,1] );
  mMatrix = mat4.scale(mMatrix, [0.27, 0.27, 1.0]);
  drawTriangle(color, mMatrix);
  mMatrix = popMatrix(matrixStack);

  pushMatrix(matrixStack, mMatrix);
  color = [0, 0, 0, 0.8];
  mMatrix = mat4.translate(mMatrix, [0.7, 0.05, 0]);
  mMatrix = mat4.scale(mMatrix, [0.02,0.38, 0.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);



  pushMatrix(matrixStack, mMatrix);
  color = [0, 0, 0, 0.8];
  mMatrix = mat4.translate(mMatrix, [0.62, 0.03, 0]);
  mMatrix = mat4.rotate(mMatrix ,degToRad(-30) , [0,0,1] );
  mMatrix = mat4.scale(mMatrix, [0.008,0.3, 0.0]);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);



  pushMatrix(matrixStack, mMatrix);
  color = [0.8, 0.8, 0.8, 1]; 
  
  mMatrix = mat4.translate(mMatrix, [0.7, -0.13, 0]);
  mMatrix = mat4.rotate(mMatrix,degToRad(180),[0,0,1]);
  mMatrix = mat4.scale(mMatrix, [0.35, 0.08, 1.0]);
  const shearMatrix = mat4.create();
  mat4.identity(shearMatrix);
  
  shearMatrix[7] = 0.25;  
  console.log(shearMatrix)
  
  mat4.multiply(mMatrix, shearMatrix, mMatrix);
  console.log("Final transformation matrix:", mMatrix);
  drawSquare(color, mMatrix);
  mMatrix = popMatrix(matrixStack);




}


function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  gl.clearColor(0.9, 0.9, 0.8, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (animation) {
    window.cancelAnimationFrame(animation);
  }

  function animate(){

    rotationAngle += rotationSpeed;

    // Update translation based on direction
    translationX += translationSpeed * direction;

    // Reverse direction at translationRange
    if (Math.abs(translationX) > translationRange) {
        // console.log(translationX);
        direction *= -1;
    }

    // let nextTranslationX = translationX + translationSpeed * direction;

    // If the next x-coordinate exceeds the translationRange, reverse direction
    // if (Math.abs(nextTranslationX) > translationRange) {
    //     direction *= -1;
    // } else {
    //     // Otherwise, update the translation based on direction
    //     translationX = nextTranslationX;
    // }
    
    drawSky();
    drawCloud();
// drawStar(3 ,9, 0.1);
    drawStar(0.35 ,0.50, 0.5);
    drawStar(0,0,1);
    drawStar(-0.45,0.2,0.6);
    drawStar(-0.3,0.1,0.6);
    drawStar(-0.3,0.15,0.4);
// drawStar(-2.5 ,6, 0.1);
// drawStar(-3.4 ,5.8, 0.12);
    drawMountain(-0.6, 0.09, 1.8, 0.4);
    drawMountShadow(-0.555, 0.095,1.8, 0.4);  
    drawMountain(-0.076, 0.09, 2.4, 0.6);
    drawMountShadow(-0.014, 0.096,2.4, 0.6);
    drawMountain(0.7, 0.12, 1.4, 0.3);
    drawMountShadow(0.73 , 0.126,1.4,0.3);
    drawGround();
    drawPath();
    drawRiver();
    drawTrees(0.35,0.02,0.8,0.8);
    drawTrees(0,0,1,1);
    drawTrees(-0.1,0.02,0.75,0.75);
    drawBoat(translationX-0.75,0.05,0.6,0.6)
    // translationRange = 1;
    drawBoat(translationX-0.7,0,1,1);
    // translationRange = 0.1;
    drawBush(0,0,1,1);
    drawBush(0.0,0.2,0.7,0.7);
    drawBush(-0.99,0.15,0.7,0.7);
    drawBush(0.99,0.25,0.7,0.7);
    drawHut();
    drawSun();
    drawCar();
    drawWindmill(-0.14,0.06,0.7,0.7);
    drawWindmill(-0.1,0.05,1,1);
    animation = window.requestAnimationFrame(animate);
  }

  animate();
}


// This is the entry point from the html
function webGLStart() {
  var canvas = document.getElementById("exampleAnimation2D");
  initGL(canvas);
  shaderProgram = initShaders();

  //get locations of attributes declared in the vertex shader
  const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

  uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");

  //enable the attribute arrays
  gl.enableVertexAttribArray(aPositionLocation);

  uColorLoc = gl.getUniformLocation(shaderProgram, "color");

  initSquareBuffer();
  initTriangleBuffer();
  initCircleBuffer();
  drawScene();
  canvas.addEventListener('click', function (event) {
    var rect = canvas.getBoundingClientRect();
    var x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    var y = ((event.clientY - rect.top) / canvas.height) * -2 + 1;
    console.log('Canvas Coordinates: (', x.toFixed(2), ',', y.toFixed(2), ')');
  });
}


• Designed a Java based Data load utility tool to load data
into database using Spring Batch Framework.
• Inputs were flat files and a configuration specifying input file,
delimiter, desired columns, and destination target table.
• Handled high volume of data upto 10 million rows per file.
• Implemented quality checks on loaded data to identify failures
• Configurable to either fail on first error or continue with error.
• Used Junit and Mockito for unit testing of the tool