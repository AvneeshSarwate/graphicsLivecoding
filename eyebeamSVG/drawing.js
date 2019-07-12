function drawing() {
    var width = 1920 * rd, height = 1080 * rd;

    var transformFunc = xy => normExec(xy, xyN => {
        var warp = coordWarp(xyN, time / 4, .5, 20);
        var cent = { x: .5, y: .5 };
        var diag = .5;
        // warp = mix(cent, warp, (1-(diag-distance(warp, cent))/diag)**2);
        warp = mix(xyN, warp, sinN(time + xyN.x * PI * 10.5) * 3 * sinN(time + xyN.x * PI));
        return warp;
    }, width, height);

    // transformFunc = a => a;
    var foldRes = 50;// + 50 * sinN(time/10);
    var t2 = time / 10;
    // transformFunc = xy => ({x: xy.x*.7 + sinN(t2+xy.x/width*PI*foldRes)*0.3*width*sinN(time/1.2), 
    //                         y: xy.y*.7 + cosN(t2+xy.y/height*PI*foldRes)*0.3*height*sinN(time/1.4)});
    // transformFunc = a => ({x:a.x * sinN(time), y: a.y * sinN(time)});

    // if(frameCount%3 == 0 && swapInfo.swaps.length > 0){
    //     var swapPoints = swapInfo.swaps.pop();
    //     shapeArraySwap(swapPoints[0], swapPoints[1], swapInfo.shapeArrays);
    // }

    letters.forEach(function (letter, i) {
        var m = matricies[i];
        var phase = i / letters.length * PI * 2;// * (1 + 10 * sinN(time / 3.3));

        var mapFunction = letter.type == "path" ? pathCoordinateTransform : polygonCoordinateTransform;
        var shapeArray = mapFunction(baseArrays[i], xyN => mix(xyN, transformFunc(xyN), sliders[1] / 127));
        // letter.plot(shapeArray);

        var frameBox = { x: 0, y: 0, width: width, height: height };
        var bbox = getBoundingBox(baseArrays[i]);
        var xy2 = mix(bbox, transformFunc(bbox), sliders[5] / 127);
        bbox.x = xy2.x;
        bbox.y = xy2.y;
        letter.plot(putLetterInBox(shapeArray, bbox));

        // if(frameCount%3 == 0 && swapInfo.swaps.length >= 0){
        //     letter.plot(swapInfo.shapeArrays[i]);
        // }
        // letter.fill({ opacity: sinN(time*4 + phase) });

    });

    frameCount++

    //render the updated SVG to a canvas
    renderSVGtoCanvas();
    flock.run();
    /*
    if(easeTask.isFinished){
        let boids = randSetSample(flock.boids.length, 3);

        // select directions (filter out occupied slots, and make sure two boids don't move into same slot)


        create set of start/end points
        create interpolation function for seleced boids+points
        initiate new easeTask

    } else {
        easeTask.eval(time)
    }

    */
}