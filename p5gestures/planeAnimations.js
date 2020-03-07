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

function* lineLerpGen(ind, duration){
    let startTIme = getTime();
    let elapsed = 0;
    while(/*elapsed < duration*/true){
        let frac = elapsed/duration;
        push();
        let sweepPoints = [];
        try {
            let simplifiedPoints = getSimplifiedPoints(ind);
            sweepPoints = directionSweep(simplifiedPoints, sinN(getTime()*10), 'bottom').polygon;
        } catch(err){
            // console.log("SWEEP ERROR", err, sweepPoints);
        }

        noStroke();
        fill(rand(ind)*255, rand(ind+.1)*255, rand(ind+.2)*255);
        beginShape();
        sweepPoints.forEach(p => vertex(...p));
        endShape(CLOSE);

        pop();
        elapsed = getTime() - startTIme;
        yield;
    }
} 