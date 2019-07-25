let langTools = ace.require("ace/ext/language_tools");
// langTools.setCompleters([langTools.snippetCompleter, langTools.keyWordCompleter])
let editors = [null, null, null, null, null];
let defaultShaders = ["fs", "fs2"]
function initShaderEditor(editorIndex) {
    let editorId = "editor" + editorIndex;
    let editor = ace.edit(editorId);
    editor.session.setMode("ace/mode/glsl");
    editor.setTheme("ace/theme/monokaiCustom");
    editor.setDisplayIndentGuides(false);
    editor.setShowPrintMargin(false);
    let editorText = "\n\n\n//editor" + editorIndex;
    editors[editorIndex] = { editor, id: editorId, text: editorText, visible: false, lang: "frac", timeout: null };
    editor.setValue(editorText, -1);
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
    let editorId = "editor" + editorIndex;
    let editor = ace.edit(editorId);
    editor.session.setMode("ace/mode/javascript");
    editor.setTheme("ace/theme/monokaiCustom");
    editor.setDisplayIndentGuides(false);
    editor.setShowPrintMargin(false);
    let editorText = "\n\n\n//editor" + editorIndex;
    editors[editorIndex] = { editor, id: editorId, text: editorText, visible: false, lang: "js" };
    editor.setValue(editorText);
    $("#" + editorId).hide();
    editor.session.on("change", (evt) => {
        let editorInfo = editors[editorIndex];
        clearTimeout(editorInfo.timeout);
        setTimeout(() => {
            editorInfo.text = editorInfo.editor.getValue();
            const lastDraw = draw;
            try {
                eval(editorInfo.text);
                draw = drawing;
            } catch (e) {
                console.log("p5 draw function error", e.stack);
                if (e instanceof ReferenceError) {
                    console.log("p5 draw function referenceerror", e);
                }
            }
        }, 200)
    });

}

function showEditor(evt, index) {
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
    if(!evt) return;
    let tabs = $(".tablink");
    tabs.removeClass("w3-red");
    tabs.addClass("w3-black");
    $(evt.target).addClass("w3-red");
    $(evt.target).removeClass("w3-black");
}

initJSEditor(0);
initShaderEditor(1);
initShaderEditor(2);

showEditor(null, 0);