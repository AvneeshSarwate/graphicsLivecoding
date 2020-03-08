

var rand =  seed =>  {
    var x = Math.sin(seed + 1.1) * 10000;
    return x - Math.floor(x);
}

var simplex = new SimplexNoise(10);



var voronoi = new Voronoi();
var bbox = {xl: 0, xr: p5w, yt: 0, yb: p5h}
var numSites = 10;

let circleCells =  (argTime) => {
    return arrayOf(n).map((e, i, a) => {
        return {
            x: p5w/2 + Math.cos(i/a.length * Math.PI * 2 + time)*p5w/2, 
            y: p5h/2 + Math.sin(i/a.length * Math.PI * 2 + time)*p5h/2}
        });
}

let  horizontalCells = (argTime) => {
    return arrayOf(numSites).map((e, i, a) => {
        return {
            x: i/a.length * p5w, 
            y: p5h/2}
        });
}

let verticalCells = (argTime) => {
    return arrayOf(numSites).map((e, i, a) => {
        return {
            x: p5w/2, 
            y: i/a.length * p5h}
        });
}

let snoiseTrailCells = (argTime) => {
    return arrayOf(numSites).map((e, i, a) => {
        let indTime = 100 + argTime*sliders[0] - i * (sliders[1]+0.01);
        let dimScale = (noiz, dim) => (noiz +1)/2 * dim
        return {
            x: dimScale(simplex.noise2D(51.32, indTime), p5w), 
            y: dimScale(simplex.noise2D(21.32, indTime), p5h)}
        });
}

// function lineCircleLerpCells(n){
//     var lineFunc = horizontalCells(n);
//     var circFunc = circleCells(n);
//     return (argTime) => {
//         let a = sliders[0];
//         let lineSites = lineFunc(argTime);
//         let circSites = circFunc(argTime);
//         return lineSites.map((e, i) => {
//             return mix(e, circSites[i], a);
//         });
//     }
// }
function sitesLerp(siteFuncGen1, siteFuncGen2, lerpFunc){
    var siteFunc1 = siteFuncGen1;
    var siteFunc2 = siteFuncGen2;
    return (argTime) => {
        let a = lerpFunc();
        let sites1 = siteFunc1(argTime);
        let sites2 = siteFunc2(argTime);
        return sites1.map((e, i) => {
            return mix(e, sites2[i], a);
        });
    }
}

var voronoiRefSites = snoiseTrailCells;// sitesLerp(numSites, verticalCells, horizontalCells, () => sinN(time));
var voronoiSites = voronoiRefSites(0).map(s => Object.assign({}, s));
var voronoiStructure = voronoi.compute(voronoiSites, bbox);




var animationGenerators = [
    i => defaultGen(i),
    i => planeLerpGen(i, 1, "top"),
    i => planeLerpGen(i, 1, "bottom"),
    i => planeLerpGen(i, 1, "left"),
    i => planeLerpGen(i, 1, "right"),
    i => defaultGen(i),
    i => defaultGen(i),
    i => defaultGen(i)
];

var voronoiSiteAnimations = arrayOf(numSites).map((e, i) => planeLerpGen(i, 1, "bottom"));
var voronoiDrawFuncs = arrayOf(numSites).map((e, i) => (() => null));

//number from 11/88 launchPad index style
function midiPadToPoint(midiNum){
    return { 
        x: ((midiNum%10)-1 + 0.5) / 8 * p5W,
        y: (9-(Math.floor(midiNum/10))-1 + 0.5) / 8 * p5h
    }

}

function parsePadSiteMap(mapStr){
    let padMap = JSON.parse(mapStr);
    let padPoints = [];
    // numSites = 
    Object.keys(padMap).forEach(k => {
        let v = padMap[k];
        padPoints.push(midiPadToPoint(k));

    });
    return;
}

osc.on("/padSiteMap", (msg)=>{
    let someVar = msg.args[0];

});