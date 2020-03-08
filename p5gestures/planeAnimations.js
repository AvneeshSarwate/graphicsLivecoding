function* defaultGen(ind){
    while(true){
        let site = voronoiSites[ind];
        let cell = voronoiStructure.cells[site.voronoiId];
        fill(rand(ind)*255, rand(ind+.1)*255, rand(ind+.2)*255);
        beginShape();
        orderedEdges(cell).forEach(pt => vertex(pt[0], pt[1]))
        endShape(CLOSE);
        yield;
    }
}

function getSimplifiedPoints(siteInd){
    let site = voronoiSites[siteInd];
    let cell = voronoiStructure.cells[site.voronoiId];
    return orderedEdges(cell);
}

function* planeLerpGen(ind, duration, direction){
    let startTime = getTime();
    let lastFrameTime = startTime;
    let elapsed = 0;
    while(true){
        let frac = Math.min(1, elapsed/duration);
        //TODO - gesutre start phase - frac = Math.max(Math.min(1, elapsed/duration - ind*sliders[4]), 0)
        
        let sweepPoints = [];
        try {
            let simplifiedPoints = getSimplifiedPoints(ind);
            sweepPoints = directionSweep(simplifiedPoints, frac, direction).polygon;
        } catch(err){
            console.log("SWEEP ERROR", err, sweepPoints);
            yield false;
        }
        let newTime = getTime()
        elapsed += (newTime - lastFrameTime) *sliders[3] ; //TODO-slider - put one here for gesture time (and preset slider js array val to start at "1")
        lastFrameTime = newTime;
        yield () => {
            push();

            noStroke();
            fill(rand(ind)*255, rand(ind+.1)*255, rand(ind+.2)*255);
            beginShape();
            sweepPoints.forEach(p => vertex(...p));
            endShape(CLOSE);

            pop();
        }
        
    }
} 