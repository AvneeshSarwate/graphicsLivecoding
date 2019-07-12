var rd = 0.25; //downscaling SVG for performance (rd stand for resolutionDowngrade)
const glCanvas = document.querySelector("#glCanvas");
glCanvas.width = 1920 * rd * 2;
glCanvas.height = 1080 * rd * 2;

//can enter/exit fullscreen display with spacebar
// document.addEventListener("keyup", (event) => {
//     console.log("key", event);
//     if (event.code == "Space") {
//         toggleFullScreen();
//     }
//     if (event.code == "KeyR") {
//         const headerFSreq = $.get("header.frag");
//         const fsReq = $.get("eyebeamSVG.glsl");
//         Promise.all([headerFSreq, fsReq]).then( shaderArray => {
//             console.log("shaderArray", shaderArray);
//             programInfo = twgl.createProgramInfo(gl, ["vs", shaderArray[0]+shaderArray[1]]);
//         });
//     }
// });
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        glCanvas.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

//setting up 
const gl = document.querySelector("#glCanvas").getContext("webgl2", {
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
    if(!p5SetupCalled) return;
    // if(twgl.resizeCanvasToDisplaySize(gl.canvas)){
    //     twgl.resizeFramebufferInfo(gl, frameBuffers[0]);
    //     twgl.resizeFramebufferInfo(gl, frameBuffers[1]);
    // }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    refreshUniforms();

    const uniforms = getPass1Uniforms();

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);

    twgl.bindFramebufferInfo(gl, frameBuffers[(frameBufferIndex + 1) % 2]);
    twgl.drawBufferInfo(gl, bufferInfo);

    const uniforms_stage2 = getPass2Uniforms();

    gl.useProgram(programInfo_stage2.program);
    twgl.setBuffersAndAttributes(gl, programInfo_stage2, bufferInfo);
    twgl.setUniforms(programInfo_stage2, uniforms_stage2);

    twgl.bindFramebufferInfo(gl);
    twgl.drawBufferInfo(gl, bufferInfo);

    frameBufferIndex = (frameBufferIndex + 1) % 2;

    redraw();
    fpsMeter.tick();
}



const moduleName = window.location.href.split("?")[1];

const headerFSreq = $.get("header.frag");
const fsReq = $.get(moduleName+"/shader1.glsl");
const fsReq2 = $.get(moduleName+"/shader2.glsl");
let programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
let programInfo_stage2 = twgl.createProgramInfo(gl, ["vs", "fs2"]);

let setupPromise = $.get({url: moduleName+"/setup.js", dataType: "text"});
let drawingPromise = $.get({url: moduleName+"/drawing.js", dataType: "text"});
let controllersPromise = $.get({url: moduleName+"/controllers.js", dataType: "text"});

let headerShader;

const globalEval = eval;

async function loadShadersAndAssets(){

    var shaderArray = await Promise.all([headerFSreq, fsReq, fsReq2, setupPromise, drawingPromise, controllersPromise]);

    //TODO - figure out why $.get() on JS automatically evals script (tho it seems to do it to global scope, which is good)
    globalEval(shaderArray[3]);
    globalEval(shaderArray[4]);
    draw = drawing;
    globalEval(shaderArray[5]);

    var assetArray = await Promise.all(assetPromises);

    textures = handleAssetsAndCreateTextures(...postPromiseAssets);
    
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



var langTools = ace.require("ace/ext/language_tools");
// langTools.setCompleters([langTools.snippetCompleter, langTools.keyWordCompleter])
var editors = [null, null, null, null, null];
var defaultShaders = ["fs", "fs2"]
function initShaderEditor(editorIndex) {
    var editorId = "editor" + editorIndex;
    var editor = ace.edit(editorId);
    editor.session.setMode("ace/mode/glsl");
    editor.setTheme("ace/theme/monokaiCustom");
    editor.setDisplayIndentGuides(false);
    editor.setShowPrintMargin(false);
    var shaderText = $("#" + defaultShaders[Math.sign(editorIndex - 1)]).html(); //assume buffer 0 is p5, 1 is baseShader, 2... are post processing 
    editors[editorIndex] = { editor, id: editorId, text: shaderText, visible: false, lang: "frac", timeout: null };
    editor.setValue(shaderText, -1);
    $("#" + editorId).hide();
    editor.session.on("change", (evt) => {
        let editorInfo = editors[editorIndex];
        clearTimeout(editorInfo.timeout);
        setTimeout(() => {
            editorInfo.text = editorInfo.editor.getValue();
            let newProgram = twgl.createProgramInfo(gl, ["vs", headerShader + editorInfo.text], (err) => {
                console.log(err);
            });
            if (editorIndex === 1 && newProgram) {
                programInfo = newProgram;
            }
            if (editorIndex === 2 && newProgram) {
                programInfo_stage2 = newProgram;
            }
        }, 200)
    });
}

function initJSEditor(editorIndex) {
    var editorId = "editor" + editorIndex;
    var editor = ace.edit(editorId);
    editor.session.setMode("ace/mode/javascript");
    editor.setTheme("ace/theme/monokaiCustom");
    editor.setDisplayIndentGuides(false);
    editor.setShowPrintMargin(false);
    editors[editorIndex] = { editor, id: editorId, shaderText: "\n\n\n\n\n" + editorId, visible: false, lang: "js" };
    editor.setValue("\n\n\n\n\n" + editorId);
    $("#" + editorId).hide();

}

function showEditor(index) {
    if (!editors[index]) return;
    editors.forEach((editorInfo, ind) => {
        if (editorInfo) {
            if (index != ind) {
                $("#" + editorInfo.id).hide();
                editorInfo.visible = false;
            }
            else {
                $("#" + editorInfo.id).show();
                editorInfo.visible = true;
            }
        }
    });

}