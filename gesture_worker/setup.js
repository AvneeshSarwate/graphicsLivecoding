//NOTE: - all callback values available outside of the eval must be VAR, not LET
console.log("setup eval");

var arrayOf = n => Array.from(new Array(n), () => 0);
var p5w = 640, p5h = 480;
var cvn;
var p5Canvas = document.createElement("canvas");
// p5Canvas.width = p5w;
// p5Canvas.height = p5h;
var p5SetupCalled = false;

var sliders = Array.from(new Array(127), (e, i) => 0);

osc = new OSC({
    discardLateMessages: true
});

// osc.connect('localhost', 8085);


osc.on("/exampleListener", (msg)=>{
    let someVar = msg.args[0];
});

var debugFlags = arrayOf(100);

var gestureShareWorker = new SharedWorker(document.location.origin+"/gestureDeltas/gesture_share_worker.js");

var gesturePoints = [];


gestureShareWorker.port.onmessage = (e) => {
    // console.log("gesture points", e.data);
    gesturePoints = e.data;
}
gestureShareWorker.port.start();


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
function handleAssetsAndCreateTextures(postPromiseAssets, resolvedPromises){
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
        backbuffer: frameBuffers[frameBufferIndex].attachments[0],
        sliderVals: sliders
    }
}

function getPass2Uniforms(){
    return {
        time: time,
        resolution: [gl.canvas.width, gl.canvas.height],
        p5: textures.p5Canvas,
        lastStage: frameBuffers[(frameBufferIndex + 1) % 2].attachments[0],
        backbuffer: frameBuffers2[frameBufferIndex].attachments[0],
        sliderVals: sliders
    }
}

var refTime = Date.now() / 1000;
var time = 0;
var getTime = () => time;
var speedScale = (time) => 2 * sliders[0]; //TODO sliders

function refreshUniforms(){
    var increment = Date.now() / 1000 - refTime;
    time += increment * speedScale(refTime);
    twgl.setTextureFromElement(gl, textures.p5Canvas, p5Canvas);
    refTime = Date.now() / 1000;
}