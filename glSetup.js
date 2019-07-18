var rd = 0.25; //downscaling SVG for performance (rd stand for resolutionDowngrade)
const glCanvas = document.querySelector("#glCanvas");
glCanvas.width = 1920 * rd * 2;
glCanvas.height = 1080 * rd * 2;

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        glCanvas.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function createVideo(url) {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'blob';
    let eyeVideo = document.createElement("video");
    eyeVideo.muted = true;
    eyeVideo.loop = true;
    // eyeVideo.src = url;
    eyeVideo.style = "display: none;"
    req.onload = function () {
        // Onload is triggered even on 404
        // so we need to check the status code
        if (this.status === 200) {
            var videoBlob = this.response;
            var vidBlobUrl = URL.createObjectURL(videoBlob);
            try {
                eyeVideo.src = vidBlobUrl;
            } catch (err) {
                console.log("blob exception", err);
            }
        }
    };
    req.onerror = function () {
        console.log("error loading blob video for", url);
    }
    req.send();
    return eyeVideo;
}


function setupWebcam() {
    const video = document.createElement('video');


    var hasUserMedia = navigator.webkitGetUserMedia ? true : false;

    if (!hasUserMedia) return createVideo("selfie.mp4");

    var playing = false;
    var timeupdate = false;

    video.autoplay = true;
    video.muted = true;
    video.loop = true;

    var constraints = { video: { width: 1280, height: 720 } };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (mediaStream) {
            video.srcObject = mediaStream;
            video.onloadedmetadata = function (e) {
                video.play();
            };
        })
        .catch(function (err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.

    return video;
}


//setting up 
const webgl2Supported = !!document.querySelector("#glCanvas").getContext("webgl2");
const gl = document.querySelector("#glCanvas").getContext(webgl2Supported ? "webgl2" : "webgl", {
    alpha: false,
    depth: false,
    antialias: true,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true
});
const frameBuffers = [twgl.createFramebufferInfo(gl), twgl.createFramebufferInfo(gl)];

const arrays = {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

let textures = {};

let frameBufferIndex = 0;

function render() {
    requestAnimationFrame(render);
    if(!p5SetupCalled) return; //extra defensive - might not need this anymore

    // if(twgl.resizeCanvasToDisplaySize(gl.canvas)){
    //     twgl.resizeFramebufferInfo(gl, frameBuffers[0]);
    //     twgl.resizeFramebufferInfo(gl, frameBuffers[1]);
    // }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    refreshUniforms(); //module-callback
    const uniforms = getPass1Uniforms(); //module-callback
    const uniforms_stage2 = getPass2Uniforms(); //module-callback

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);

    twgl.bindFramebufferInfo(gl, frameBuffers[(frameBufferIndex + 1) % 2]);
    twgl.drawBufferInfo(gl, bufferInfo);

    gl.useProgram(programInfo_stage2.program);
    twgl.setBuffersAndAttributes(gl, programInfo_stage2, bufferInfo);
    twgl.setUniforms(programInfo_stage2, uniforms_stage2);

    twgl.bindFramebufferInfo(gl);
    twgl.drawBufferInfo(gl, bufferInfo);

    frameBufferIndex = (frameBufferIndex + 1) % 2;

    redraw();
    fpsMeter.tick();
}


const moduleString = window.location.href.split("?")[1]
const moduleName = moduleString ? moduleString : "eyebeamSVG";

const shaderPaths = {
    header: webgl2Supported ? "header.frag" : "header_gl1.frag",
    pass1: webgl2Supported ? moduleName+"/shader1.glsl" : moduleName+"/shader1_gl1.glsl",
    pass2: webgl2Supported ? moduleName+"/shader2.glsl" : moduleName+"/shader2_gl1.glsl"
};

const headerFSreq = $.get(shaderPaths.header);
const fsReq = $.get(shaderPaths.pass1);
const fsReq2 = $.get(shaderPaths.pass2);
let programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
let programInfo_stage2 = twgl.createProgramInfo(gl, ["vs", "fs2"]);

let setupPromise = $.get({url: moduleName+"/setup.js", dataType: "text"});
let drawingPromise = $.get({url: moduleName+"/drawing.js", dataType: "text"});
let controllersPromise = $.get({url: moduleName+"/controllers.js", dataType: "text"});

let headerShader;

const globalEval = eval;

async function loadShadersAndAssets(){

    var shaderArray = await Promise.all([headerFSreq, fsReq, fsReq2, setupPromise, drawingPromise, controllersPromise]);

    globalEval(shaderArray[3]);
    globalEval(shaderArray[4]);
    draw = drawing;
    globalEval(shaderArray[5]);

    await Promise.all(assetPromises); //module-callback - define assetPromises

    textures = handleAssetsAndCreateTextures(...postPromiseAssets); //module-callback - define postPromiseAssets
    
    console.log("shaderArray", shaderArray);
    headerShader = shaderArray[0];

    programInfo = twgl.createProgramInfo(gl, ["vs", shaderArray[0] + shaderArray[1]]);
    programInfo_stage2 = twgl.createProgramInfo(gl, ["vs", shaderArray[0] + shaderArray[2]]);

    editors[0].editor.setValue(shaderArray[4], -1);
    editors[1].editor.setValue(shaderArray[1], -1);
    editors[2].editor.setValue(shaderArray[2], -1);

    requestAnimationFrame(render);
}

loadShadersAndAssets();