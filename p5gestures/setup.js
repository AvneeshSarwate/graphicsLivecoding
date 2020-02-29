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

var sliders = Array.from(new Array(127), (e, i) => 0);

var mod = (x, n) => ((x%n)+n)%n;

var voronoi = new Voronoi();
var bbox = {xl: 0, xr: p5w, yt: 0, yb: p5h}
var voronoiRefSites = arrayOf(100).map(e => ({x:Math.random()*p5w, y:Math.random()*p5h}));
var voronoiSites = voronoiRefSites.map(s => Object.assign({}, s));
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