var colorWidth = 300;
var colorHeight = 50;
var colorDiv = document.getElementById('colorDiv');
var colorCanvas = document.createElement('canvas');
colorCanvas.setAttribute('width', colorWidth);
colorCanvas.setAttribute('height', colorHeight);
colorCanvas.setAttribute('id', 'colorCanvas');
colorDiv.appendChild(colorCanvas);
var colorContext = colorCanvas.getContext("2d");
var gradient1 = colorContext.createLinearGradient(0, 0, colorCanvas.width, 0);
gradient1.addColorStop(0, 'red');
gradient1.addColorStop(1 / 6, 'orange');
gradient1.addColorStop(2 / 6, 'yellow');
gradient1.addColorStop(3 / 6, 'green');
gradient1.addColorStop(4 / 6, 'blue');
gradient1.addColorStop(5 / 6, 'indigo');
gradient1.addColorStop(1, 'violet');
colorContext.fillStyle = gradient1;
colorContext.fillRect(0, 10, colorCanvas.width, colorCanvas.height);
var gradient2 = colorContext.createLinearGradient(0, 0, 0, colorCanvas.height);
gradient2.addColorStop(0, 'white');
gradient2.addColorStop(1, 'rgba(0,0,0,0)');
colorContext.fillStyle = gradient2;
colorContext.fillRect(0, 10, colorCanvas.width, colorCanvas.height);
fillWithCurColor();

function fillWithCurColor() {
  colorContext.rect(0, 0, colorCanvas.width, 10);
  colorContext.fillStyle = "rgba(" + curColor.r + ", " + curColor.g + ", " + curColor.b + ", 255)";
  colorContext.fill();
  $('#chooseOtherColor').css({
    color: "rgba(" + curColor.r + ", " + curColor.g + ", " + curColor.b + ", 255)"
  });
}

$('#colorCanvas').click(function(e) {
  var x = event.pageX - this.offsetLeft;
  var y = event.pageY - this.offsetTop;
  var pixel = colorContext.getImageData(x, y, 1, 1).data;
  var r = pixel[0];
  var g = pixel[1];
  var b = pixel[2];
  curColor = {
    r: r,
    b: b,
    g: g
  };
  fillWithCurColor();
  $('.colors').children().removeClass("selected");
  $('#chooseOtherColor').addClass("selected");
  $('#colorDiv').addClass('hide');
});

$('#chooseOtherColor').click( function(e) {
  $('#colorDiv').toggleClass('hide');
});
