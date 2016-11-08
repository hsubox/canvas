var default_width = 500;
var default_height = 300;

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;

var colorRed = "red";
var colorOrange = "orange";
var colorYellow = "yellow";
var colorGreen = "green";
var colorBlue = "blue";
var colorPurple = "purple";
var colorBlack = "black";
var colorWhite = "white";
var clickColor = new Array();
var curColor = colorPurple;

var clickSize = new Array();
var curSize = "normal";

var clickTool = new Array();
var curTool = "marker";

var canvasDiv = document.getElementById('canvasDiv');
var canvas = document.createElement('canvas');
canvas.setAttribute('width', default_width);
canvas.setAttribute('height', default_height);
canvas.setAttribute('id', 'canvas');
canvasDiv.appendChild(canvas);
context = canvas.getContext("2d");

var outlineImage = new Image();
outlineImage.src = "pattern1.png";
outlineImage.onload = function() {
  canvas.setAttribute('width', this.width);
  canvas.setAttribute('height', this.height);
  context.drawImage(this, 0, 0);
};

$('#canvas').mousedown(function(e) {
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  paint = true;
  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
  redraw();
});
$('#canvas').mousemove(function(e) {
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  if (paint) {
    addClick(mouseX, mouseY, true);
    redraw();
  }
});
$('#canvas').mouseup(function(e) {
  paint = false;
  redraw();
});
$('#canvas').mouseleave(function(e) {
  paint = false;
});

$('#chooseRed').mousedown(function(e) {
  curColor = colorRed;
});
$('#chooseOrange').mousedown(function(e) {
  curColor = colorOrange;
});
$('#chooseYellow').mousedown(function(e) {
  curColor = colorYellow;
});
$('#chooseGreen').mousedown(function(e) {
  curColor = colorGreen;
});
$('#chooseBlue').mousedown(function(e) {
  curColor = colorBlue;
});
$('#choosePurple').mousedown(function(e) {
  curColor = colorPurple;
});
$('#chooseBlack').mousedown(function(e) {
  curColor = colorBlack;
});

$('#chooseSmall').mousedown(function(e) {
  curSize = "small";
});
$('#chooseNormal').mousedown(function(e) {
  curSize = "normal";
});
$('#chooseLarge').mousedown(function(e) {
  curSize = "large";
});
$('#chooseHuge').mousedown(function(e) {
  curSize = "huge";
});

$('#chooseMarker').mousedown(function(e) {
	curTool = "marker";
	redraw();
});
$('#chooseEraser').mousedown(function(e) {
	curTool = "eraser";
});
$('#clearCanvas').mousedown(function(e) {
	clickX = new Array();
	clickY = new Array();
	clickDrag = new Array();
	clickColor = new Array();
	clickSize = new Array();
	redraw();
});

function addClick(x, y, dragging) {
  clickX.push(x);
  clickY.push(y);
  clickTool.push(curTool);
  if (curTool == "eraser") {
    clickColor.push(colorWhite);
  } else {
    clickColor.push(curColor);
  }
  clickSize.push(curSize);
  clickDrag.push(dragging);
}

function clearCanvas() {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}


function redraw() {
  clearCanvas();
  context.lineJoin = "round";

  for (var i = 0; i < clickX.length; i++) {
    switch (clickSize[i]) {
      case "small":
        radius = 2;
        break;
      case "normal":
        radius = 5;
        break;
      case "large":
        radius = 10;
        break;
      default:
        radius = 20;
        break;
    }
    context.beginPath();
    if(clickDrag[i] && i) {
      context.moveTo(clickX[i-1], clickY[i-1]);
    } else {
      context.moveTo(clickX[i]-1, clickY[i]);
    }
    context.lineTo(clickX[i], clickY[i]);
    context.closePath();
    context.strokeStyle = clickColor[i];
    context.lineWidth = radius;
    context.stroke();
    // context.globalAlpha = 1;
  }

  context.drawImage(outlineImage, 0, 0);
}
