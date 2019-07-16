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
    editor.session.on("change", (evt) => {
        let editorInfo = editors[editorIndex];
        clearTimeout(editorInfo.timeout);
        setTimeout(() => {
            editorInfo.text = editorInfo.editor.getValue();
            const lastDraw = draw;
            try{
                eval(editorInfo.text);
                draw = drawing;
            } catch(e){
                console.log("p5 draw function error", e.stack);
                if (e instanceof ReferenceError) {
                    console.log("p5 draw function referenceerror", e);
                }
            }
        }, 200)
    });

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

initJSEditor(0);
initShaderEditor(1);
initShaderEditor(2);

showEditor(0);