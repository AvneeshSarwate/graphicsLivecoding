

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

function directionSweep(cellPoints, frac, direction){
    let cellBbox = getBBox(cellPoints);
    let isHorizontal = ['left', 'right'].includes(direction);
    if(['bottom', 'right'].includes(direction)) frac = 1 - frac;

    let fracVal = isHorizontal ? mixn(cellBbox.minX, cellBbox.maxX, frac) : mixn(cellBbox.minY, cellBbox.maxY, frac);
    let fracLine = isHorizontal ? [{x: fracVal, y: cellBbox.maxY}, {x: fracVal, y: cellBbox.minY}] : [{x: cellBbox.maxX, y: fracVal}, {x: cellBbox.minX, y: fracVal}];
    
    let lineSegments = cellPoints.map((p, i, a) => {
        let p2 = a[(i+1)%a.length];
        return [{x: p[0], y: p[1]}, {x: p2[0], y: p2[1]}];
    });
    let intersections = lineSegments.map(s => segment_intersection(s, fracLine)).filter(i => i).map(p => [p.x, p.y]);

    let allPoints = []; 
    if     (direction === 'top') allPoints = cellPoints.filter(p => p[1] <= fracVal);
    else if(direction === 'bottom') allPoints = cellPoints.filter(p => p[1] >= fracVal);
    else if(direction === 'left') allPoints = cellPoints.filter(p => p[0] <= fracVal);
    else if(direction === 'right') allPoints = cellPoints.filter(p => p[0] >= fracVal);
    intersections.forEach(p => allPoints.push(p));

    let centerX = cellPoints.map(p => p[0]).reduce((a,b) => a+b/cellPoints.length, 0);
    let centerY = cellPoints.map(p => p[1]).reduce((a,b) => a+b/cellPoints.length, 0);
    let pointsTheta = allPoints.map(p => {
        return{
            x: p[0],
            y: p[1],
            theta: Math.atan2(p[1]-centerY, p[0]-centerX)
        }
    });

    let polygon = pointsTheta.sort((p1, p2) => p2.theta - p1.theta).map(p => [p.x, p.y]);
    return {polygon, line: fracLine};
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


