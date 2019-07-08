//function to re-structure SVG Paths to make them more manipulation-friendly     
function removeVHFromPath(pathArray) {
    var currentPos = { x: 0, y: 0 };
    var pathSegments = [];
    pathArray.forEach(function (seg, i) {
        switch (seg[0]) {
            case "M":
                currentPos.x = seg[1];
                currentPos.y = seg[2];
                pathSegments.push(seg);
                break;
            case "L":
                currentPos.x = seg[1];
                currentPos.y = seg[2];
                pathSegments.push(seg);
                break;
            case "S":
                currentPos.x = seg[3];
                currentPos.y = seg[4];
                pathSegments.push(seg);
                break;
            case "C":
                currentPos.x = seg[5];
                currentPos.y = seg[6];
                pathSegments.push(seg);
                break;
            case "V":
                pathSegments.push(["L", currentPos.x, seg[1]]);
                currentPos.y = seg[1]
                break;
            case "H":
                pathSegments.push(["L", seg[1], currentPos.y]);
                currentPos.x = seg[1];
                break;
            case "Z":
                pathSegments.push(seg);
                break;
            default:
                console.log("unanticipated segment", seg)
        }
    });
    return pathSegments;
}

//helper function to re-render paths
function pathArrayToString(pathArray) {
    var segmentStrings = pathArray.map(segment => segment[0] + segment.slice(1).join(" "));
    return segmentStrings.join(" ");
}

//function that maps a coordinate transform over all of the points in an SVG Path
function pathCoordinateTransform(pathArray, transform) {
    var pathSegments = [];
    pathArray.forEach(function (seg, i) {
        switch (seg[0]) {
            case "M":
                var p1 = transform({ x: seg[1], y: seg[2] });
                pathSegments.push(["M", p1.x, p1.y]);
                break;
            case "L":
                var p1 = transform({ x: seg[1], y: seg[2] });
                pathSegments.push(["L", p1.x, p1.y]);
                break;
            case "S":
                var p1 = transform({ x: seg[1], y: seg[2] });
                var p2 = transform({ x: seg[3], y: seg[4] });
                pathSegments.push(["S", p1.x, p1.y, p2.x, p2.y]);
                break;
                break;
            case "C":
                var p1 = transform({ x: seg[1], y: seg[2] });
                var p2 = transform({ x: seg[3], y: seg[4] });
                var p3 = transform({ x: seg[5], y: seg[6] });
                pathSegments.push(["C", p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]);
                break;
            case "Z":
                pathSegments.push(seg);
                break;
            default:
                console.log("unanticipated segment", seg)
        }
    });
    return pathSegments;
}

//function that maps a coordinate transform over an SVG Polygon
function polygonCoordinateTransform(pointArray, transform) {
    return pointArray.map(p => ({ x: p[0], y: p[1] })).map(p => transform(p)).map(p => [p.x, p.y]);
}

function getBoundingBox(shapeArray) {
    let box = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
    };
    function updateBox(point, box) {
        if (point[0] < box.minX) box.minX = point[0];
        if (point[0] > box.maxX) box.maxX = point[0];
        if (point[1] < box.minY) box.minY = point[1];
        if (point[1] > box.maxY) box.maxY = point[1];
    }
    shapeArray.forEach(section => {
        if (section.length == 2) updateBox(section, box)
        else {
            for (let i = 1; i < section.length; i += 2) {
                updateBox(section.slice(i, i + 2), box);
            }
        }
    });

    return { x: box.minX, y: box.minY, width: box.maxX - box.minX, height: box.maxY - box.minY };
}

function putLetterInBox(shapeArray, newBox) {
    var ob = getBoundingBox(shapeArray); //originalBox
    var isPath = shapeArray[0].length % 2 === 1;
    var transFunc = xy => ({ x: (xy.x - ob.x) * (newBox.width / ob.width) + newBox.x, y: (xy.y - ob.y) * (newBox.height / ob.height) + newBox.y });
    var mapFunction = isPath ? pathCoordinateTransform : polygonCoordinateTransform;
    return mapFunction(shapeArray, transFunc);

}

function boxMix(box1, box2, a) {
    var mx = (a, b, m) => a * (1 - m) + b * m;
    return {
        x: mx(box1.x, box2.x, a),
        y: mx(box1.y, box2.y, a),
        width: mx(box1.width, box2.width, a),
        height: mx(box1.height, box2.height, a),
    }
}

//wrapper function to execute SVG Path cleanup
function replaceVH(ind, baseArrays, letters) {
    var newPath = removeVHFromPath(baseArrays[ind]);
    // console.log(baseArrays[ind]);
    // console.log(newPath);
    var stringPath = pathArrayToString(newPath);
    letters[ind].plot(stringPath);
}

//a bunch of utility functions for doing coordinate transformations
function vecsub(v1, v2) {
    var isVec = !(typeof v2 == "number");
    return { x: v1.x - (isVec ? v2.x : v2), y: v1.y - (isVec ? v2.y : v2) }
};
var sinN = t => (Math.sin(t) + 1) / 2;
var cosN = t => (Math.cos(t) + 1) / 2;
var fract = v => v - Math.floor(v);
var randf = v => fract(sin(v * 1000));
var mix = (v1, v2, a) => ({ x: v1.x * (1 - a) + v2.x * a, y: v1.y * (1 - a) + v2.y * a });
function mod(n, m) {
    return ((n % m) + m) % m;
}
//wrap a normalized coordinate mapping function to p5 coordinates 
function normExec(p5N, transFunc, p5w, p5h) {
    var inN = { x: p5N.x / p5w, y: p5N.y / p5h };
    var out = transFunc(inN);
    return { x: out.x * p5w, y: out.y * p5h };
}
var length = v => (v.x ** 2 + v.y ** 2) ** 0.5;
let distance = (v1, v2) => ((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2) ** 0.5
function coordWarp(stN, t2, rad, numBalls) {
    let warp = { x: stN.x, y: stN.y };
    for (var i = 0; i < numBalls; i++) {
        let p = { x: sinN(t2 * randf(i + 1.) * 1.3 + i), y: cosN(t2 * randf(i + 1.) * 1.1 + i) };
        warp = length(vecsub(stN, p)) <= rad ? mix(warp, p, 1. - length(vecsub(stN, p)) / rad) : warp;
    }
    return warp;
}

function shapeArraySwap(pos1, pos2, shapeArrays) {
    let point1 = shapeArrays[pos1[0]][pos1[1]].slice(pos1[2], pos1[2] + 2);
    let point2 = shapeArrays[pos2[0]][pos2[1]].slice(pos2[2], pos2[2] + 2);

    shapeArrays[pos1[0]][pos1[1]].splice(pos1[2], 2, point2[0], point2[1]);
    shapeArrays[pos2[0]][pos2[1]].splice(pos2[2], 2, point1[0], point1[1]);
}

function randomSwaps(baseArrays, numSwaps) {
    let newArrays = _.cloneDeep(baseArrays);
    let listOfSwaps = [];
    function getRandomPoint() {
        let r = Math.random, f = Math.floor;
        let shape = f(r() * newArrays.length);
        let seg = f(r() * newArrays[shape].length);
        let segLen = newArrays[shape][seg].length;
        if (segLen == 1) return -1;
        let pathDev = segLen % 2;
        let pt = pathDev + f(r() * (segLen - pathDev) / 2) * 2;
        return [shape, seg, pt];
    }
    for (let i = 0; i < numSwaps; i++) {
        let swapPair = [getRandomPoint(), getRandomPoint()];
        if (swapPair[0] == -1 || swapPair[1] == -1) continue;
        shapeArraySwap(swapPair[0], swapPair[1], newArrays);
        listOfSwaps.push(swapPair);
    }
    return { shapeArrays: newArrays, swaps: listOfSwaps, getRandomPoint: getRandomPoint };
}