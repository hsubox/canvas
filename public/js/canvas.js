var socket = io();

// if no outlineImage, canvas will take this size
var default_width = 500;
var default_height = 300;

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;
var outlineLayerData;
var colorLayerData;

var colorRed = { r: 255, g: 0, b: 0 };
var colorOrange = { r: 255, g: 165, b: 0 };
var colorYellow =  { r: 255, g: 255, b: 0 };
var colorGreen = { r: 0, g: 255, b: 0 };
var colorBlue = { r: 0, g: 0, b: 255 };
var colorPurple = { r: 128, g: 0, b: 128 };
var colorWhite = { r: 255, g: 255, b: 255 };
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
outlineImage.src = "img/pattern1.png";
outlineImage.onload = function() {
  canvas.setAttribute('width', this.width);
  canvas.setAttribute('height', this.height);
  context.drawImage(this, 0, 0);
  try {
    outlineLayerData = context.getImageData(0, 0, canvas.width, canvas.height);
	} catch (ex) {
    console.error(ex);
  }
};

// socket updates
socket.on('draw', function(drawData){
  clickX = drawData.clickX;
  clickY = drawData.clickY;
  clickDrag = drawData.clickDrag;
  clickColor = drawData.clickColor;
  clickSize = drawData.clickSize;
  clickTool = drawData.clickTool;
  redraw();
});
socket.on('fill', function(fillData) {
  paintAt(fillData.mouseX, fillData.mouseY, fillData.color);
  redraw();
});
socket.on('clear', function() {
  clear();
});

// mouse events
$('#canvas').mousedown(function(e) {
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  if (curTool == "bucket") {
    colorLayerData = context.getImageData(0, 0, canvas.width, canvas.height);
    paintAt(mouseX, mouseY, curColor);
    socket.emit('fill', {
      mouseX: mouseX,
      mouseY: mouseY,
      color: curColor
    });
  } else {
    paint = true;

    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
    addClick(mouseX, mouseY, false);
    redraw();
  }
});
$('#canvas').mousemove(function(e) {
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  if (curTool != "bucket" && paint) {
    addClick(mouseX, mouseY, true);
    redraw();
  }
});
$('#canvas').mouseup(function(e) {
  if (curTool != "bucket") {
    paint = false;
  }
  redraw();
  socket.emit('draw', {
    clickX: clickX,
    clickY: clickY,
    clickDrag: clickDrag,
    clickColor: clickColor,
    clickSize: clickSize,
    clickTool: clickTool
  });
});
$('#canvas').mouseleave(function(e) {
  if (curTool != "bucket") {
    paint = false;
  }
  socket.emit('draw', {
    clickX: clickX,
    clickY: clickY,
    clickDrag: clickDrag,
    clickColor: clickColor,
    clickSize: clickSize,
    clickTool: clickTool
  });
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
$('#chooseFill').mousedown(function(e) {
	curTool = "bucket";
});
$('#clearCanvas').mousedown(function(e) {
	clear();
  socket.emit('clear')
});

function clear() {
  clickX = new Array();
	clickY = new Array();
	clickDrag = new Array();
	clickColor = new Array();
	clickSize = new Array();
  colorLayerData = null;
	redraw();
  // colorLayerData = null;
}

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

  context.lineCap = "round";
  context.lineJoin = "round";

  if (colorLayerData) {
    context.putImageData(colorLayerData, 0, 0);
  }

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
    context.strokeStyle = "rgb(" + clickColor[i].r + ", " + clickColor[i].g + ", " + clickColor[i].b + ")";
    context.lineWidth = radius;
    context.stroke();
    // context.globalAlpha = 1;
  }

  context.drawImage(outlineImage, 0, 0);
  colorLayerData = context.getImageData(0, 0, canvas.width, canvas.height);
}

function matchOutlineColor(r, g, b, a) {
  return (r + g + b < 100 && a === 255);
}

function matchStartColor (pixelPos, startR, startG, startB, color) {

  var r = outlineLayerData.data[pixelPos];
  var g = outlineLayerData.data[pixelPos + 1];
	var b = outlineLayerData.data[pixelPos + 2];
	var a = outlineLayerData.data[pixelPos + 3];

	// If current pixel of the outline image is black
	if (matchOutlineColor(r, g, b, a)) {
	   return false;
	}

	r = colorLayerData.data[pixelPos];
	g = colorLayerData.data[pixelPos + 1];
	b = colorLayerData.data[pixelPos + 2];

	// If the current pixel matches the clicked color
	if (r === startR && g === startG && b === startB) {
		return true;
	}

	// If current pixel matches the new color
	if (r === color.r && g === color.g && b === color.b) {
		return false;
	}

	// Return the difference in current color and start color within a tolerance
	return (Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) < 255);
}

function colorPixel (pixelPos, r, g, b, a) {
	colorLayerData.data[pixelPos] = r;
	colorLayerData.data[pixelPos + 1] = g;
	colorLayerData.data[pixelPos + 2] = b;
	colorLayerData.data[pixelPos + 3] = a !== undefined ? a : 255;
}

function floodFill (startX, startY, startR, startG, startB, color) {
  var newPos;
  var x;
  var y;
  var pixelPos;
  var reachLeft;
  var reachRight;
  var drawingBoundLeft = 0;
  var drawingBoundTop = 0;
  var drawingBoundRight = canvas.width - 1;
  var drawingBoundBottom = canvas.height - 1;
  var pixelStack = [[startX, startY]];

	while (pixelStack.length > 0) {
    newPos = pixelStack.pop();
		x = newPos[0];
		y = newPos[1];
		// Get current pixel position
		pixelPos = (y * canvas.width + x) * 4;
		// Go up as long as the color matches and are inside the canvas
		while (y >= drawingBoundTop && matchStartColor(pixelPos, startR, startG, startB, color)) {
			y -= 1;
			pixelPos -= canvas.width * 4;
		}
		pixelPos += canvas.width * 4;
		y += 1;
		reachLeft = false;
		reachRight = false;
		// Go down as long as the color matches and in inside the canvas
		while (y <= drawingBoundBottom && matchStartColor(pixelPos, startR, startG, startB, color)) {
			y += 1;
			colorPixel(pixelPos, color.r, color.g, color.b);
			if (x > drawingBoundLeft) {
				if (matchStartColor(pixelPos - 4, startR, startG, startB, color)) {
					if (!reachLeft) {
						// Add pixel to stack
						pixelStack.push([x - 1, y]);
						reachLeft = true;
					}
				} else if (reachLeft) {
					reachLeft = false;
				}
			}
			if (x < drawingBoundRight) {
				if (matchStartColor(pixelPos + 4, startR, startG, startB, color)) {
					if (!reachRight) {
						// Add pixel to stack
						pixelStack.push([x + 1, y]);
						reachRight = true;
					}
				} else if (reachRight) {
					reachRight = false;
				}
			}
			pixelPos += canvas.width * 4;
		}
	}
}

// Start painting with paint bucket tool starting from pixel specified by startX and startY
function paintAt (startX, startY, color) {
	var pixelPos = (startY * canvas.width + startX) * 4;
  var r = colorLayerData.data[pixelPos];
	var g = colorLayerData.data[pixelPos + 1];
	var b = colorLayerData.data[pixelPos + 2];
	var a = colorLayerData.data[pixelPos + 3];

  // Return because trying to fill with the same color
	if (r === color.r && g === color.g && b === color.b) {
		return;
	}
  // Return because clicked outline
	if (matchOutlineColor(r, g, b, a)) {
		return;
	}

	floodFill(startX, startY, r, g, b, color);
	redraw();
}