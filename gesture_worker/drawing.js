console.log("drawing.js eval");

var newTime = 10;
function drawing(){
    clear();
    fill(255, 0, 0);
    gesturePoints.forEach(gp => ellipse(gp.x*width, gp.y*height, 20))
}