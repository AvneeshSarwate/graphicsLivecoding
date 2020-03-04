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

function getPolygonSweep(cellPoints, frac, isVert){
    //start just working on frac as left-to-right sweep, then generalize
    let cellBbox = getBBox(cellPoints);
    let xFrac = mixn(cellBbox.minX, cellBbox.maxX);
    let fracLine = [{x: xFrac, y: cellBbox.maxY}, {x: xFrac, y: cellBbox.minY}];
    let lineSegments = cellPoints.map((p, i, a) => {
        let p2 = a[(i+1)%a.length];
        return [{x: p[0], y: p[1]}, {x: p2[0], y: p2[1]}];
    });
    let intersectingLines = lineSegments.filter(s => segment_intersection(s, fracLine));
    let sharedPointDetector = new Set(); 
    let dedupedInsersections = intersectingLines.filter(l => {
        let hasPt = p => sharedPointDetector.has(JSON.stringify(p));
        let noSharedPointsSeen = ! (hasPt(l[0]) && hasPt(l[1]));
        if(noSharedPointsSeen){
            sharedPointDetector.add(JSON.stringify(l[0]));
            sharedPointDetector.add(JSON.stringify(l[1]));
        }
        return noSharedPointsSeen
    });

    //find "top" line out of deduped lines

    //find "start" point of counterclockwise region of existing points
    //  e.g., the first point that will come after the new vertical line intersection
    //  at the top of the bbox

    //find "bottom" line out of deduped lines

    //find "end" point of counterclockwise region of existing points
    //  e.g., the last point that will come before the new vertical line intersection
    //  at the bottom of the bbox

    //extract the counter-clockwise points in order (might require wraparound)
    //  of existing array

    //insert top-line intersection with vert line at start, and samef or bottom
}