console.log("drawing.js eval");


function drawing(){
    let w = p5w;
    let h = p5h;
    let yStep = 24;
    frameInd++;
    // if(frameInd%5 != 0) return;
    time = (Date.now()/1000);
    for(let y = 0; y < yStep; y++){
        let xPos = (time*100) % w ;
        let yPos = h/yStep*y + sin(time * (1+randVals[y]))*yStep;
        let faceInd = Math.floor(mod(y/yStep, 1) * 6 );
        let face = faceImages[faceInd];
        image(face, xPos, yPos, face.width/5, face.height/5);
    }
}