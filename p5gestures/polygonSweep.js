

function getBBox(region){
    let maxX = -Infinity, maxY = -Infinity, minX = Infinity, minY = Infinity;
    region.map(p => ({x: p[0], y: p[1]})).forEach(p => {
        if(p.x > maxX) maxX = p.x;
        if(p.x < minX) minX = p.x;
        if(p.y > maxY) maxY = p.y;
        if(p.y < minY) minY = p.y;
    });
    return {minX, maxX, minY, maxY};
}

function segment_intersection(ray1, ray2) {
    let x1 = ray1[0].x,
        y1 = ray1[0].y,
        x2 = ray1[1].x,
        y2 = ray1[1].y, 
        x3 = ray2[0].x,
        y3 = ray2[0].y,
        x4 = ray2[1].x,
        y4 = ray2[1].y;
    var eps = 0.0000001;
    function between(a, b, c) {
        return a-eps <= b && b <= c+eps;
    }
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!between(x2, x, x1)) {return false;}
        } else {
            if (!between(x1, x, x2)) {return false;}
        }
        if (y1>=y2) {
            if (!between(y2, y, y1)) {return false;}
        } else {
            if (!between(y1, y, y2)) {return false;}
        }
        if (x3>=x4) {
            if (!between(x4, x, x3)) {return false;}
        } else {
            if (!between(x3, x, x4)) {return false;}
        }
        if (y3>=y4) {
            if (!between(y4, y, y3)) {return false;}
        } else {
            if (!between(y3, y, y4)) {return false;}
        }
    }
    return {x: x, y: y};
}


function leftStartSweep(cellPoints, frac){
    //start just working on frac as left-to-right sweep, then generalize
    let cellBbox = getBBox(cellPoints);
    let xFrac = mixn(cellBbox.minX, cellBbox.maxX, frac);
    let fracLine = [{x: xFrac, y: cellBbox.maxY}, {x: xFrac, y: cellBbox.minY}];
    let lineSegments = cellPoints.map((p, i, a) => {
        let p2 = a[(i+1)%a.length];
        return [{x: p[0], y: p[1]}, {x: p2[0], y: p2[1]}];
    });
    let intersectingLines = lineSegments.filter(s => segment_intersection(s, fracLine));
    let sharedPointDetector = new Set(); 
    let dedupedLines = intersectingLines.filter(l => {
        let hasPt = p => sharedPointDetector.has(JSON.stringify(p));
        let noSharedPointsSeen = !(hasPt(l[0]) && hasPt(l[1]));
        if(noSharedPointsSeen){
            sharedPointDetector.add(JSON.stringify(l[0]));
            sharedPointDetector.add(JSON.stringify(l[1]));
        }
        return noSharedPointsSeen
    });
    
    //find "top" line out of deduped lines
    let l1Max = Math.max(dedupedLines[0][0].y, dedupedLines[0][1].y);
    let l1Min = Math.min(dedupedLines[0][0].y, dedupedLines[0][1].y);
    let l2Max = Math.max(dedupedLines[1][0].y, dedupedLines[1][1].y);
    let l2Min = Math.min(dedupedLines[1][0].y, dedupedLines[1][1].y);

    //have a ! because lower Y values are on "top"
    let l1IsTop = !(l1Max >= l2Max && l1Min > l2Min);
  
    let topLine = l1IsTop ? dedupedLines[0] : dedupedLines[1];
    let bottomLine = l1IsTop ? dedupedLines[1] : dedupedLines[0];
  
  
    let topIntersection = segment_intersection(fracLine, topLine);
    let bottomIntersection = segment_intersection(fracLine, bottomLine);

  
    //in counterclockwise (cc) order, the first point
    let ccStartPointVal = topLine[0].x < topLine[1].x ? topLine[0] : topLine[1];  
    let ccEndPointVal = bottomLine[0].x < bottomLine[1].x ? bottomLine[0] : bottomLine[1];

    let searchablePoints = cellPoints.map(p => JSON.stringify(p));

    let startPtStr = JSON.stringify([ccStartPointVal.x, ccStartPointVal.y]);
    let endPtStr = JSON.stringify([ccEndPointVal.x, ccEndPointVal.y]);
    let ccStartPointInd = searchablePoints.indexOf(startPtStr);
    let ccEndPointInd = searchablePoints.indexOf(endPtStr);
  
  
    let slicedPoints = [];
    let counterInd = ccStartPointInd;
  
    slicedPoints.push(cellPoints[counterInd]);
    while(counterInd != ccEndPointInd) {  
      counterInd = (counterInd+1) % cellPoints.length;
      slicedPoints.push(cellPoints[counterInd]);
    } 
      
    slicedPoints.splice(0, 0, [topIntersection.x, topIntersection.y]);
    slicedPoints.push([bottomIntersection.x, bottomIntersection.y]);
    // console.log(slicedPoints, ccStartPointInd, ccEndPointInd);
    return {polygon: slicedPoints, line: fracLine};
}

function rightStartSweep(cellPoints, frac){
    //start just working on frac as left-to-right sweep, then generalize
    frac = 1 - frac;
    let cellBbox = getBBox(cellPoints);
    let xFrac = mixn(cellBbox.minX, cellBbox.maxX, frac);
    let fracLine = [{x: xFrac, y: cellBbox.maxY}, {x: xFrac, y: cellBbox.minY}];
    let lineSegments = cellPoints.map((p, i, a) => {
        let p2 = a[(i+1)%a.length];
        return [{x: p[0], y: p[1]}, {x: p2[0], y: p2[1]}];
    });
    let intersectingLines = lineSegments.filter(s => segment_intersection(s, fracLine));
    let sharedPointDetector = new Set(); 
    let dedupedLines = intersectingLines.filter(l => {
        let hasPt = p => sharedPointDetector.has(JSON.stringify(p));
        let noSharedPointsSeen = !(hasPt(l[0]) && hasPt(l[1]));
        if(noSharedPointsSeen){
            sharedPointDetector.add(JSON.stringify(l[0]));
            sharedPointDetector.add(JSON.stringify(l[1]));
        }
        return noSharedPointsSeen
    });
    
    //find "top" line out of deduped lines
    let l1Max = Math.max(dedupedLines[0][0].y, dedupedLines[0][1].y);
    let l1Min = Math.min(dedupedLines[0][0].y, dedupedLines[0][1].y);
    let l2Max = Math.max(dedupedLines[1][0].y, dedupedLines[1][1].y);
    let l2Min = Math.min(dedupedLines[1][0].y, dedupedLines[1][1].y);

    //have a ! because lower Y values are on "top"
    let l1IsTop = !(l1Max >= l2Max && l1Min > l2Min);
  
    let topLine = l1IsTop ? dedupedLines[0] : dedupedLines[1];
    let bottomLine = l1IsTop ? dedupedLines[1] : dedupedLines[0];
  
  
    let topIntersection = segment_intersection(fracLine, topLine);
    let bottomIntersection = segment_intersection(fracLine, bottomLine);

  
    //in counterclockwise (cc) order, the first point
    let ccStartPointVal = topLine[0].x > topLine[1].x ? topLine[0] : topLine[1];  
    let ccEndPointVal = bottomLine[0].x > bottomLine[1].x ? bottomLine[0] : bottomLine[1];

    let searchablePoints = cellPoints.map(p => JSON.stringify(p));

    let startPtStr = JSON.stringify([ccStartPointVal.x, ccStartPointVal.y]);
    let endPtStr = JSON.stringify([ccEndPointVal.x, ccEndPointVal.y]);
    let ccStartPointInd = searchablePoints.indexOf(startPtStr);
    let ccEndPointInd = searchablePoints.indexOf(endPtStr);
  
  
    let slicedPoints = [];
    let counterInd = ccStartPointInd;
  
    slicedPoints.push(cellPoints[counterInd]);
    while(counterInd != ccEndPointInd) {  
      counterInd = mod(counterInd-1, cellPoints.length);
      slicedPoints.push(cellPoints[counterInd]);
    } 
      
    slicedPoints.splice(0, 0, [topIntersection.x, topIntersection.y]);
    slicedPoints.push([bottomIntersection.x, bottomIntersection.y]);
    // console.log(slicedPoints, ccStartPointInd, ccEndPointInd);
    return {polygon: slicedPoints, line: fracLine};
}

function topStartSweep(cellPoints, frac){
    //start just working on frac as left-to-right sweep, then generalize
    let cellBbox = getBBox(cellPoints);
    let yFrac = mixn(cellBbox.minY, cellBbox.maxY, frac);
    let fracLine = [{x: cellBbox.maxX, y: yFrac}, {x: cellBbox.minX, y: yFrac}];
    let lineSegments = cellPoints.map((p, i, a) => {
        let p2 = a[(i+1)%a.length];
        return [{x: p[0], y: p[1]}, {x: p2[0], y: p2[1]}];
    });
    let intersectingLines = lineSegments.filter(s => segment_intersection(s, fracLine));
    let sharedPointDetector = new Set(); 
    let dedupedLines = intersectingLines.filter(l => {
        let hasPt = p => sharedPointDetector.has(JSON.stringify(p));
        let noSharedPointsSeen = !(hasPt(l[0]) && hasPt(l[1]));
        if(noSharedPointsSeen){
            sharedPointDetector.add(JSON.stringify(l[0]));
            sharedPointDetector.add(JSON.stringify(l[1]));
        }
        return noSharedPointsSeen
    });
    
    //find "right most" line out of deduped lines
    let l1Max = Math.max(dedupedLines[0][0].x, dedupedLines[0][1].x);
    let l1Min = Math.min(dedupedLines[0][0].x, dedupedLines[0][1].x);
    let l2Max = Math.max(dedupedLines[1][0].x, dedupedLines[1][1].x);
    let l2Min = Math.min(dedupedLines[1][0].x, dedupedLines[1][1].x);

    let l1IsRight = (l1Max >= l2Max && l1Min > l2Min);
  
    let rightLine = l1IsRight ? dedupedLines[0] : dedupedLines[1];
    let leftLine = l1IsRight ? dedupedLines[1] : dedupedLines[0];
  
  
    let rightIntersection = segment_intersection(fracLine, rightLine);
    let leftIntersection = segment_intersection(fracLine, leftLine);

  
    //in counterclockwise (cc) order, the first point
    let ccStartPointVal = rightLine[0].y < rightLine[1].y ? rightLine[0] : rightLine[1];  
    let ccEndPointVal = leftLine[0].y < leftLine[1].y ? leftLine[0] : leftLine[1];

    let searchablePoints = cellPoints.map(p => JSON.stringify(p));

    let startPtStr = JSON.stringify([ccStartPointVal.x, ccStartPointVal.y]);
    let endPtStr = JSON.stringify([ccEndPointVal.x, ccEndPointVal.y]);
    let ccStartPointInd = searchablePoints.indexOf(startPtStr);
    let ccEndPointInd = searchablePoints.indexOf(endPtStr);
  
  
    let slicedPoints = [];
    let counterInd = ccStartPointInd;
  
    slicedPoints.push(cellPoints[counterInd]);
    while(counterInd != ccEndPointInd) {  
      counterInd = mod(counterInd+1, cellPoints.length);
      slicedPoints.push(cellPoints[counterInd]);
    } 
      
    slicedPoints.splice(0, 0, [rightIntersection.x, rightIntersection.y]);
    slicedPoints.push([leftIntersection.x, leftIntersection.y]);
    // console.log(slicedPoints, ccStartPointInd, ccEndPointInd);
    return {polygon: slicedPoints, line: fracLine};
}

function bottomStartSweep(cellPoints, frac){
    //start just working on frac as left-to-right sweep, then generalize
    frac = 1 - frac;
    let cellBbox = getBBox(cellPoints);
    let yFrac = mixn(cellBbox.minY, cellBbox.maxY, frac);
    let fracLine = [{x: cellBbox.maxX, y: yFrac}, {x: cellBbox.minX, y: yFrac}];
    let lineSegments = cellPoints.map((p, i, a) => {
        let p2 = a[(i+1)%a.length];
        return [{x: p[0], y: p[1]}, {x: p2[0], y: p2[1]}];
    });
    let intersectingLines = lineSegments.filter(s => segment_intersection(s, fracLine));
    let sharedPointDetector = new Set(); 
    let dedupedLines = intersectingLines.filter(l => {
        let hasPt = p => sharedPointDetector.has(JSON.stringify(p));
        let noSharedPointsSeen = !(hasPt(l[0]) && hasPt(l[1]));
        if(noSharedPointsSeen){
            sharedPointDetector.add(JSON.stringify(l[0]));
            sharedPointDetector.add(JSON.stringify(l[1]));
        }
        return noSharedPointsSeen
    });
    
    //find "right most" line out of deduped lines
    let l1Max = Math.max(dedupedLines[0][0].x, dedupedLines[0][1].x);
    let l1Min = Math.min(dedupedLines[0][0].x, dedupedLines[0][1].x);
    let l2Max = Math.max(dedupedLines[1][0].x, dedupedLines[1][1].x);
    let l2Min = Math.min(dedupedLines[1][0].x, dedupedLines[1][1].x);

    let l1IsRight = (l1Max >= l2Max && l1Min > l2Min);
  
    let rightLine = l1IsRight ? dedupedLines[0] : dedupedLines[1];
    let leftLine = l1IsRight ? dedupedLines[1] : dedupedLines[0];
  
  
    let rightIntersection = segment_intersection(fracLine, rightLine);
    let leftIntersection = segment_intersection(fracLine, leftLine);

  
    //in counterclockwise (cc) order, the first point
    let ccStartPointVal = rightLine[0].y > rightLine[1].y ? rightLine[0] : rightLine[1];  
    let ccEndPointVal = leftLine[0].y > leftLine[1].y ? leftLine[0] : leftLine[1];

    let searchablePoints = cellPoints.map(p => JSON.stringify(p));

    let startPtStr = JSON.stringify([ccStartPointVal.x, ccStartPointVal.y]);
    let endPtStr = JSON.stringify([ccEndPointVal.x, ccEndPointVal.y]);
    let ccStartPointInd = searchablePoints.indexOf(startPtStr);
    let ccEndPointInd = searchablePoints.indexOf(endPtStr);
  
  
    let slicedPoints = [];
    let counterInd = ccStartPointInd;
  
    slicedPoints.push(cellPoints[counterInd]);
    while(counterInd != ccEndPointInd) {  
      counterInd = mod(counterInd-1, cellPoints.length);
      slicedPoints.push(cellPoints[counterInd]);
    } 
      
    slicedPoints.splice(0, 0, [rightIntersection.x, rightIntersection.y]);
    slicedPoints.push([leftIntersection.x, leftIntersection.y]);
    // console.log(slicedPoints, ccStartPointInd, ccEndPointInd);
    return {polygon: slicedPoints, line: fracLine};
}

let mod = (n, m) =>  ((n % m) + m) % m;
let arrayOf = n => Array.from(new Array(n), () => 0);
let mixn = (n1, n2, a) => n1*(1-a) + n2*a;
let mix = (v1, v2, a) => ({x: v1.x*(1-a) + v2.x*a, y: v1.y*(1-a) + v2.y*a});
let sinN = n => (Math.sin(n)+1)/2;
let cosN = n => (Math.cos(n)+1)/2;
let time2 = () => Date.now()/1000;
let r = 100;
let c = 200;
let squarePts = [[c, c], [c, c+r], [c+r, c+r], [c+r, c]];
let circlePts = arrayOf(40).map((e, i, a) => 
          [Math.cos(-i/a.length*Math.PI*2)*r+c, Math.sin(-i/a.length*Math.PI*2)*r+c])

function setup_test() {
  createCanvas(400, 400);
}

function draw_test() {
  clear();
  beginShape();
  getPolygonSweep(circlePts, sinN(time2())).map(p => vertex(...p));
  endShape(CLOSE);
  ellipse(cos(-time2())*r+c, sin(-time2())*r+c, 10);
}


