let randVals = arrayOf(24).map(v => Math.random());
let cvn;
function faces2Setup(){
    cvn = createCanvas(640, 480);
    cvn.id("p5canvas");
    faceImages[0] = loadImage("houseFaces/faces/jay.png");
    faceImages[1] = loadImage("houseFaces/faces/dac.png");
    faceImages[2] = loadImage("houseFaces/faces/neesh.png");
    faceImages[3] = loadImage("houseFaces/faces/jack.png");
    faceImages[4] = loadImage("houseFaces/faces/rohit.png");
    faceImages[5] = loadImage("houseFaces/faces/gary.png");
}

let assetPromises = [Promise.resolve("blank promise")];
let postPromiseAssets = [];

p5Canvas = document.getElementById("p5canvas")

//use twgl to create textures object here
function handleAssetsAndCreateTextures(postPromiseAssets, resolvedPromises){ //don't need arguments since we already have reference to the videos
    return twgl.createTextures(gl, {
        p5Canvas: { src: p5Canvas },
    });
}

function getPass1Uniforms(){
    return {
        time: time,
        resolution: [gl.canvas.width, gl.canvas.height],
        p5: textures.p5Canvas,
    }
}

function getPass2Uniforms(){
    return {
        time: time,
        resolution: [gl.canvas.width, gl.canvas.height],
        lastStage: frameBuffers[(frameBufferIndex + 1) % 2].attachments[0]
    }
}

var refTime = Date.now() / 1000;
var time = 0;
var speedScale = (time) => 1;

function refreshUniforms(){
    var increment = Date.now() / 1000 - refTime;
    time += increment * speedScale(refTime);
    twgl.setTextureFromElement(gl, textures.p5, p5Canvas);
    refTime = Date.now() / 1000;
}