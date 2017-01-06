var colorWidth = Math.min(window.innerWidth, 600);
var colorHeight = 30;
var colorDiv = document.getElementById('colorDiv');
var colorCanvas = document.createElement('canvas');
colorCanvas.setAttribute('width', colorWidth);
colorCanvas.setAttribute('height', colorHeight);
colorCanvas.setAttribute('id', 'colorCanvas');
colorDiv.appendChild(colorCanvas);
var colorContext = colorCanvas.getContext('2d');
$('#colorDiv').addClass('hide');

var gradient1 = colorContext.createLinearGradient(0, 0, colorCanvas.width, 0);
gradient1.addColorStop(0, 'red');
gradient1.addColorStop(1 / 6, 'orange');
gradient1.addColorStop(2 / 6, 'yellow');
gradient1.addColorStop(3 / 6, 'green');
gradient1.addColorStop(4 / 6, 'blue');
gradient1.addColorStop(5 / 6, 'indigo');
gradient1.addColorStop(1, 'violet');
colorContext.fillStyle = gradient1;
colorContext.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

var gradient2 = colorContext.createLinearGradient(0, colorCanvas.height, 0, 0);
gradient2.addColorStop(0, 'white');
gradient2.addColorStop(1, 'rgba(0,0,0,0)');
colorContext.fillStyle = gradient2;
colorContext.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
fillWithCurColor();

function fillWithCurColor() {
  $('#chooseOtherColor').css({
    color: 'rgba(' + curColor.r + ', ' + curColor.g + ', ' + curColor.b + ', 255)',
  });
}

$('#colorCanvas').click(function(e) {
  var mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft;
  var mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;
  var pixel = colorContext.getImageData(mouseX, mouseY, 1, 1).data;
  var r = pixel[0];
  var g = pixel[1];
  var b = pixel[2];
  curColor = {
    r: r,
    b: b,
    g: g,
  };
  fillWithCurColor();
  $('.colors').children().removeClass('selected');
  $('#chooseOtherColor').addClass('selected');
});

$('#chooseOtherColor').click( function(e) {
  $('#colorDiv').toggleClass('hide');
});
