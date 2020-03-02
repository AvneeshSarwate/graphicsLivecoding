//NOTE: - all callback values available outside of the eval must be VAR, not LET
console.log("setup eval");

var arrayOf = n => Array.from(new Array(n), () => 0);
var p5w = 640, p5h = 480;
var cvn;
var p5Canvas = document.createElement("canvas");
// p5Canvas.width = p5w;
// p5Canvas.height = p5h;
var p5SetupCalled = false;

var sinN = n => (Math.sin(n)+1)/2;
var cosN = n => (Math.cos(n)+1)/2;
var rand =  seed =>  {
    var x = Math.sin(seed + 1.1) * 10000;
    return x - Math.floor(x);
}

var simplex = new SimplexNoise();

var sliders = Array.from(new Array(127), (e, i) => 0);

var mod = (x, n) => ((x%n)+n)%n;

var voronoi = new Voronoi();
var bbox = {xl: 0, xr: p5w, yt: 0, yb: p5h}
function circleCells(n){
    return (time) => {
        return arrayOf(n).map((e, i, a) => {
            return {
                x: p5w/2 + Math.cos(i/a.length * Math.PI * 2)*p5w/2, 
                y: p5h/2 + Math.sin(i/a.length * Math.PI * 2)*p5h/2}
            });
    }
}
function horizontalCells(n){
    return (time) => {
        return arrayOf(n).map((e, i, a) => {
            return {
                x: i/a.length * p5w, 
                y: p5h/2}
            });
    }
}
function snoiseTrailCells(n){
    return (time) => {
        return arrayOf(n).map((e, i, a) => {
            let indTime = time - i * (sliders[0]+0.01);
            let dimScale = (noiz, dim) => ((noiz /(.5)**0.5)+1)/2 * dim
            return {
                x: dimScale(simplex.noise2D(51.32, indTime), p5h), 
                y: dimScale(simplex.noise2D(21.32, indTime), p5w)}
            });
    }
}

var voronoiRefSites = snoiseTrailCells(100);
var voronoiSites = voronoiRefSites(0).map(s => Object.assign({}, s));
var voronoiStructure = voronoi.compute(voronoiSites, bbox);

















function setup(){
    cvn = createCanvas(p5w, p5h);
    cvn.id("p5Canvas");
    p5Canvas = document.getElementById("p5Canvas");
    p5SetupCalled = true;
    noLoop();
}

var assetPromises = [Promise.resolve("blank promise")];
var postPromiseAssets = [];



//use twgl to create textures object here
function handleAssetsAndCreateTextures(postPromiseAssets, resolvedPromises){ //don't need arguments since we already have reference to the videos
    return twgl.createTextures(gl, {
        backbuffer: frameBuffers[frameBufferIndex].attachments[0],
        p5Canvas: { src: p5Canvas, flipY: false},
    });
}

function getPass1Uniforms(){
    return {
        time: time,
        resolution: [gl.canvas.width, gl.canvas.height],
        p5: textures.p5Canvas,
        backbuffer: frameBuffers[frameBufferIndex].attachments[0]
    }
}

function getPass2Uniforms(){
    return {
        time: time,
        resolution: [gl.canvas.width, gl.canvas.height],
        p5: textures.p5Canvas,
        lastStage: frameBuffers[(frameBufferIndex + 1) % 2].attachments[0],
        backbuffer: frameBuffers2[frameBufferIndex].attachments[0]
    }
}

var refTime = Date.now() / 1000;
var time = 0;
var speedScale = (time) => 1;

function refreshUniforms(){
    var increment = Date.now() / 1000 - refTime;
    time += increment * speedScale(refTime);
    twgl.setTextureFromElement(gl, textures.p5Canvas, p5Canvas);
    refTime = Date.now() / 1000;
}