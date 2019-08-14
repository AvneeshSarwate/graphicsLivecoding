console.log("drawing.js eval");

function drawing(){
    ellipse(p5w/2, p5h/2 + sin(time)*100, min(p5w/2, p5h/2)/2);
}