var socket = io();
var url = window.location.pathname;
socket.on('connect', function() {
   socket.emit('room', url);
});
var newUser = true;

var outlineImageSrc = 'img' + url + '.png';

// if no outlineImage, canvas will take this size
var defaultWidth = 500;
var defaultHeight = 500;
// outlineImage will be scaled down if larger than these dimensions
var maxWidth = Math.min(window.innerWidth, 800);
var maxHeight = Math.min(window.innerHeight - 150, 500);

var clickX = [];
var clickY = [];
var clickDrag = [];
var paint;
var outlineLayerData;
var outlineLayerDataURL;
var colorFillData;

var colorRed = {r: 255, g: 0, b: 0};
var colorOrange = {r: 255, g: 165, b: 0};
var colorYellow = {r: 255, g: 255, b: 0};
var colorGreen = {r: 0, g: 128, b: 0};
var colorBlue = {r: 0, g: 0, b: 255};
var colorPurple = {r: 128, g: 0, b: 128};
var colorWhite = {r: 255, g: 255, b: 255};
var clickColor = [];
var curColor = colorPurple;
$('#choosePurple').addClass('selected');

var clickSize = [];
var curSize = 'normal';
$('#chooseNormal').addClass('selected');

var clickTool = [];
var curTool = 'marker';
$('#chooseMarker').addClass('selected');

var canvasDiv = document.getElementById('canvasDiv');
var canvas = document.createElement('canvas');
canvas.setAttribute('width', defaultWidth);
canvas.setAttribute('height', defaultHeight);
canvas.setAttribute('id', 'canvas');
canvasDiv.appendChild(canvas);
var context = canvas.getContext('2d');

$('#imageLoader').change(handleImage);
var imageChange = false;

function handleImage(e) {
  imageChange = true;
  var reader = new FileReader();
  reader.onload = function(e) {
      outlineImageOriginal.src = e.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

// outlineImageTransparent takes outlineImageOriginal and makes the white areas transparent
var outlineImageOriginal = new Image();
try {
  outlineImageOriginal.src = outlineImageSrc;
} catch (e) {
  outlineImageOriginal.src = '';
}
var outlineImageTransparent = new Image();
outlineImageOriginal.onload = function() {
  // resizes image if very large
  var normalizedWidth = this.width;
  var normalizedHeight = this.height;
  if (normalizedWidth > maxWidth) {
    normalizedHeight = parseInt((maxWidth / normalizedWidth) * normalizedHeight);
    normalizedWidth = maxWidth;
  }
  if (normalizedHeight > maxHeight) {
    normalizedWidth = parseInt((maxHeight / normalizedHeight) * normalizedWidth);
    normalizedHeight = maxHeight;
  }
  canvas.setAttribute('width', normalizedWidth);
  canvas.setAttribute('height', normalizedHeight);
  context.drawImage(this, 0, 0, normalizedWidth, normalizedHeight);
  try {
    outlineLayerData = context.getImageData(0, 0, canvas.width, canvas.height);
    makeTransparent();
    if (imageChange) {
      clearCanvas();
      imageChange = false;
      socketEmitImageChange();
    }
    if (newUser) {
      socketEmitImageRequest();
      newUser = false;
    }
	} catch (ex) {
    console.error(ex);
  }
};

function makeTransparent() {
  for (var pixel = 0; pixel < outlineLayerData.data.length; pixel += 4) {
    var r = outlineLayerData.data[pixel];
    var g = outlineLayerData.data[pixel + 1];
    var b = outlineLayerData.data[pixel + 2];
    var a = outlineLayerData.data[pixel + 3];
    if (r + g + b > 600) {
      outlineLayerData.data[pixel] = 255;
      outlineLayerData.data[pixel + 1] = 255;
      outlineLayerData.data[pixel + 2] = 255;
      outlineLayerData.data[pixel + 3] = 0;
    } else if (r + g + b < 400 && a > 100) {
      outlineLayerData.data[pixel] = 30;
      outlineLayerData.data[pixel + 1] = 30;
      outlineLayerData.data[pixel + 2] = 30;
      outlineLayerData.data[pixel + 3] = 255;
    }
  }
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.putImageData(outlineLayerData, 0, 0);
  outlineImageTransparent.src = canvas.toDataURL();
  context.drawImage(outlineImageTransparent, 0, 0, canvas.width, canvas.height);
}

// socket updates
socket.on('draw', function(drawData) {
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
  clearCanvas();
});
socket.on('image', function(imageData) {
  outlineImageOriginal.src = imageData.outlineLayerDataURL;
  var initialImage = new Image();
  initialImage.src = imageData.dataURL;
  initialImage.onload = function() {
    canvas.setAttribute('width', this.width);
    canvas.setAttribute('height', this.height);
    context.drawImage(this, 0, 0);
    try {
      colorFillData = context.getImageData(0, 0, canvas.width, canvas.height);
    } catch (ex) {
      console.error(ex);
    }
  };
  redraw();
});
socket.on('imageRequest', function() {
  socketEmitImage();
});
function socketEmitDraw() {
  socket.emit('draw', {
    clickX: clickX,
    clickY: clickY,
    clickDrag: clickDrag,
    clickColor: clickColor,
    clickSize: clickSize,
    clickTool: clickTool,
  });
}
function socketEmitFill(mouseX, mouseY) {
  socket.emit('fill', {
    mouseX: mouseX,
    mouseY: mouseY,
    color: curColor,
  });
}
function socketEmitClear() {
  socket.emit('clear');
}
function socketEmitImage() {
  var dataURL = canvas.toDataURL();
  outlineLayerDataURL = outlineImageOriginal.src;
  socket.emit('image', {
    dataURL: dataURL,
    outlineLayerDataURL: outlineLayerDataURL,
  });
}
function socketEmitImageChange() {
  console.log('emitting image change');
  var dataURL = canvas.toDataURL();
  outlineLayerDataURL = outlineImageOriginal.src;
  socket.emit('imageChange', {
    dataURL: dataURL,
    outlineLayerDataURL: outlineLayerDataURL,
  });
}
function socketEmitImageRequest() {
  socket.emit('imageRequest');
}

// mouse and touch event handling
function press(e) {
  var mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft;
  var mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;
  if (curTool == 'bucket') {
    paintAt(mouseX, mouseY, curColor);
    socketEmitFill(mouseX, mouseY);
  } else {
    paint = true;
    addClick(mouseX, mouseY, false);
    redraw();
  }
}
canvas.addEventListener('mousedown', press, false);
canvas.addEventListener('touchstart', press, false);

function drag(e) {
  var mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft;
  var mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;
  if (curTool != 'bucket' && paint) {
    addClick(mouseX, mouseY, true);
    redraw();
    socketEmitDraw();
  }
}
canvas.addEventListener('mousemove', drag, false);
canvas.addEventListener('touchmove', drag, false);

function release() {
  if (curTool != 'bucket') {
    paint = false;
    redraw();
    socketEmitDraw();
    resetStrokes();
  }
}
canvas.addEventListener('mouseup', release);
canvas.addEventListener('touchend', release, false);

function cancel() {
  if (curTool != 'bucket') {
    paint = false;
    socketEmitDraw();
    resetStrokes();
  }
}
canvas.addEventListener('mouseout', cancel, false);
canvas.addEventListener('touchcancel', cancel, false);

$('#chooseRed').click(function(e) {
  e.preventDefault();
  curColor = colorRed;
  $('.colors').children().removeClass('selected');
  $(this).addClass('selected');
  fillWithCurColor();
});
$('#chooseOrange').click(function(e) {
  e.preventDefault();
  curColor = colorOrange;
  $('.colors').children().removeClass('selected');
  $(this).addClass('selected');
  fillWithCurColor();
});
$('#chooseYellow').click(function(e) {
  e.preventDefault();
  curColor = colorYellow;
  $('.colors').children().removeClass('selected');
  $(this).addClass('selected');
  fillWithCurColor();
});
$('#chooseGreen').click(function(e) {
  e.preventDefault();
  curColor = colorGreen;
  $('.colors').children().removeClass('selected');
  $(this).addClass('selected');
  fillWithCurColor();
});
$('#chooseBlue').click(function(e) {
  e.preventDefault();
  curColor = colorBlue;
  $('.colors').children().removeClass('selected');
  $(this).addClass('selected');
  fillWithCurColor();
});
$('#choosePurple').click(function(e) {
  e.preventDefault();
  curColor = colorPurple;
  $('.colors').children().removeClass('selected');
  $(this).addClass('selected');
  fillWithCurColor();
});

$('#chooseSmall').click(function(e) {
  e.preventDefault();
  curSize = 'small';
  $('.size').children().removeClass('selected');
  $(this).addClass('selected');
});
$('#chooseNormal').click(function(e) {
  e.preventDefault();
  curSize = 'normal';
  $('.size').children().removeClass('selected');
  $(this).addClass('selected');
});
$('#chooseLarge').click(function(e) {
  e.preventDefault();
  curSize = 'large';
  $('.size').children().removeClass('selected');
  $(this).addClass('selected');
});
$('#chooseHuge').click(function(e) {
  e.preventDefault();
  curSize = 'huge';
  $('.size').children().removeClass('selected');
  $(this).addClass('selected');
});

$('#chooseMarker').click(function(e) {
  e.preventDefault();
	curTool = 'marker';
  $('.tools').children().removeClass('selected');
  $(this).addClass('selected');
});
$('#chooseEraser').click(function(e) {
  e.preventDefault();
	curTool = 'eraser';
  $('.tools').children().removeClass('selected');
  $(this).addClass('selected');
});
$('#chooseFill').click(function(e) {
  e.preventDefault();
	curTool = 'bucket';
  $('.tools').children().removeClass('selected');
  $(this).addClass('selected');
});
$('#clearCanvas').click(function(e) {
  e.preventDefault();
	clearCanvas();
  socketEmitClear();
});
$('#saveImage').click(function(e) {
  e.preventDefault();
  var dataURL = canvas.toDataURL();
  this.href = dataURL;
});

function clearCanvas() {
  resetStrokes();
  colorFillData = null;
	redraw();
}

function resetStrokes() {
  clickX = [];
	clickY = [];
	clickDrag = [];
	clickColor = [];
	clickSize = [];
}

function addClick(x, y, dragging) {
  clickX.push(x);
  clickY.push(y);
  clickTool.push(curTool);
  if (curTool == 'eraser') {
    clickColor.push(colorWhite);
  } else {
    clickColor.push(curColor);
  }
  clickSize.push(curSize);
  clickDrag.push(dragging);
}

function redraw() {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (colorFillData) {
    context.putImageData(colorFillData, 0, 0);
  }

  for (var i = 0; i < clickX.length; i++) {
    switch (clickSize[i]) {
      case 'small':
        radius = 2;
        break;
      case 'normal':
        radius = 5;
        break;
      case 'large':
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
    context.strokeStyle = 'rgb(' + clickColor[i].r + ', ' + clickColor[i].g + ', ' + clickColor[i].b + ')';
    context.lineWidth = radius;
    context.stroke();
  }
  context.drawImage(outlineImageTransparent, 0, 0, canvas.width, canvas.height);
  colorFillData = context.getImageData(0, 0, canvas.width, canvas.height);
}

// For bucket fill
function matchOutlineColor(r, g, b, a) {
  return (r + g + b < 100 && a > 50);
}

function matchStartColor(pixelPos, startR, startG, startB, color) {
  var r = outlineLayerData.data[pixelPos];
  var g = outlineLayerData.data[pixelPos + 1];
	var b = outlineLayerData.data[pixelPos + 2];
	var a = outlineLayerData.data[pixelPos + 3];

	// If current pixel of the outline image is black
	if (matchOutlineColor(r, g, b, a)) {
    return false;
	}

	r = colorFillData.data[pixelPos];
	g = colorFillData.data[pixelPos + 1];
	b = colorFillData.data[pixelPos + 2];

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

function colorPixel(pixelPos, r, g, b, a) {
	colorFillData.data[pixelPos] = r;
	colorFillData.data[pixelPos + 1] = g;
	colorFillData.data[pixelPos + 2] = b;
	colorFillData.data[pixelPos + 3] = a !== undefined ? a : 255;
}

function floodFill(startX, startY, startR, startG, startB, color) {
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
function paintAt(startX, startY, color) {
  colorFillData = context.getImageData(0, 0, canvas.width, canvas.height);

	var pixelPos = (startY * canvas.width + startX) * 4;
  var r = colorFillData.data[pixelPos];
	var g = colorFillData.data[pixelPos + 1];
	var b = colorFillData.data[pixelPos + 2];
	var a = colorFillData.data[pixelPos + 3];

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
