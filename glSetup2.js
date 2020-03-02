let rd = 0.25; //downscaling SVG for performance (rd stand for resolutionDowngrade)
const glCanvas = document.querySelector("#glCanvas");
glCanvas.width = 1920 * rd * 2;
glCanvas.height = 1080 * rd * 2;

var fpsMeter = new FPSMeter();
fpsMeter.hide();

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
    let req = new XMLHttpRequest();
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
            let videoBlob = this.response;
            let vidBlobUrl = URL.createObjectURL(videoBlob);
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


    let hasUserMedia = navigator.webkitGetUserMedia ? true : false;

    if (!hasUserMedia) return createVideo("selfie.mp4");

    let playing = false;
    let timeupdate = false;

    video.autoplay = true;
    video.muted = true;
    video.loop = true;

    let constraints = { video: { width: 1280, height: 720 } };

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

function changeWebcamSelection(camInd, webcamElem){
    navigator.mediaDevices.enumerateDevices()
        .then(function(deviceList){return deviceList.filter(device => device.kind == "videoinput")}) 
        .catch(function(err) { console.log(err.name + ": " + err.message); })  
        .then(function(cameras){
            var constraints = {video: { width: 1280, height: 720,  deviceId: cameras[camInd].deviceId} }; 
            navigator.mediaDevices.getUserMedia(constraints)
              .then(function(mediaStream) {
                webcamElem.srcObject = mediaStream;
                webcamElem.onloadedmetadata = function(e) {
                    webcamElem.play();
                };
              })
        });
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
const frameBuffers2 = [twgl.createFramebufferInfo(gl), twgl.createFramebufferInfo(gl)];

const arrays = {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

let textures = {};

let frameBufferIndex = 0;

function editorAnimation(){
    // $("#editor-container").css("top", sinN(time*3 +cos(time))*150);
    // $("#editor-container").css("left", cosN(time*3 + sin(time*1.3))*150);
}

let stopRenderFlag = false;
function stopRender(){
    stopRenderFlag = true;
}

function render() {

    if(stopRenderFlag){
        stopRenderFlag = false;
        return;
    }

    editorAnimation();

    requestAnimationFrame(render);
    if(!p5SetupCalled) return; //extra defensive - might not need this anymore

    // if(twgl.resizeCanvasToDisplaySize(gl.canvas)){
    //     twgl.resizeFramebufferInfo(gl, frameBuffers[0]);
    //     twgl.resizeFramebufferInfo(gl, frameBuffers[1]);
    // }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    //get uniform values
    refreshUniforms(); //module-callback
    const uniforms = getPass1Uniforms(); //module-callback
    const uniforms_stage2 = getPass2Uniforms(); //module-callback

    //set up pass 1 program and bind uniforms
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);

    //draw pass 1 to framebuffer
    twgl.bindFramebufferInfo(gl, frameBuffers[(frameBufferIndex + 1) % 2]);
    twgl.drawBufferInfo(gl, bufferInfo);

    //set up pass 2 program and bind uniforms
    gl.useProgram(programInfo_stage2.program);
    twgl.setBuffersAndAttributes(gl, programInfo_stage2, bufferInfo);
    twgl.setUniforms(programInfo_stage2, uniforms_stage2);

    //draw pass 2 to framebuffer
    twgl.bindFramebufferInfo(gl, frameBuffers2[(frameBufferIndex + 1) % 2]);
    twgl.drawBufferInfo(gl, bufferInfo);

    //todo - Use another shader pass to render the last framebuffer to canvas.
    //     - Rendering directly to canvas will make the alpha value in the last 
    //     - pass behave like a blend against the background rather than as a 
    //     - "free" memory channel. See how "screenProgram" is used in The_Force

    //draw pass 2 to canvas
    twgl.bindFramebufferInfo(gl);
    twgl.drawBufferInfo(gl, bufferInfo); 

    frameBufferIndex = (frameBufferIndex + 1) % 2;

    redraw();
    fpsMeter.tick();
}

const shaderPaths = {
    header: webgl2Supported ? "../header.frag" : "../header_gl1.frag",
    pass1: webgl2Supported ? "shader1.glsl" : "shader1_gl1.glsl",
    pass2: webgl2Supported ? "shader2.glsl" : "shader2_gl1.glsl"
};

const headerFSreq = $.get(shaderPaths.header);
const fsReq = $.get(shaderPaths.pass1);
const fsReq2 = $.get(shaderPaths.pass2);
let programInfo; 
let programInfo_stage2;

let drawingPromise = $.get({url: "drawing.js", dataType: "text"});

let headerShader;

async function loadShadersAndAssets(){

    let shaderArray = await Promise.all([headerFSreq, fsReq, fsReq2, drawingPromise]);

    draw = drawing;

    let resolvedPromises = await Promise.all(assetPromises).catch(e => console.log("asset error", e)); //module-callback - define assetPromises

    textures = handleAssetsAndCreateTextures(postPromiseAssets, resolvedPromises); //module-callback - define postPromiseAssets
    
    // console.log("shaderArray", shaderArray);
    headerShader = shaderArray[0];

    programInfo = twgl.createProgramInfo(gl, ["vs", shaderArray[0] + shaderArray[1]]);
    programInfo_stage2 = twgl.createProgramInfo(gl, ["vs", shaderArray[0] + shaderArray[2]]);

    editors[0].editor.setValue(shaderArray[3], -1);
    editors[1].editor.setValue(shaderArray[1], -1);
    editors[2].editor.setValue(shaderArray[2], -1);

    requestAnimationFrame(render);
}

loadShadersAndAssets();