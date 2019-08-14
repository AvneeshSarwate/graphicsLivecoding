let langTools = ace.require("ace/ext/language_tools");
// langTools.setCompleters([langTools.snippetCompleter, langTools.keyWordCompleter])
let editors = [null, null, null, null, null];
let defaultShaders = ["fs", "fs2"];

let debugging = false;

function setMarkersForShaderError(editorInfo, errorResultString){
    //TODO - figure out why markers (e.g. line highlights) aren't working properly
    // while(editorInfo.errorMarkers.length > 0){
    //     let mark = editorInfo.errorMarkers.pop();
    //     editorInfo.editor.session.removeMarker(mark);
    // }

    editorInfo.editor.session.clearAnnotations();

    let lineOffset = headerShader.split("\n").length;
    let lines = errorResultString.match(/^.*((\r\n|\n|\r)|$)/gm);

    let tAnnotations = [];
    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(":");
        if(i > lineOffset){
            console.log(lines[i]);
        }
        if (parts.length === 5 || parts.length === 6) 
        {
            let annotation = {};
            annotation.row = parseInt(parts[2]) - lineOffset;
            annotation.text = parts[3] + " : " + parts[4];
            annotation.type = "error";

            tAnnotations.push(annotation);
            
            // let mark = editorInfo.editor.session.addMarker(new Range(annotation.row, 0, annotation.row, 1), "errorHighlight", "fullLine", false);
            // editorInfo.errorMarkers.push(mark);
        } 
    }

    editorInfo.editor.session.setAnnotations(tAnnotations);
}

debugging = false;
function initShaderEditor(editorIndex) {
    let editorId = "editor" + editorIndex;
    let editor = ace.edit(editorId);

    editor.session.setMode("ace/mode/glsl");
    editor.setTheme("ace/theme/monokaiCustom");
    editor.setDisplayIndentGuides(false);
    editor.setShowPrintMargin(false);
    let editorText = "\n\n\n//editor" + editorIndex;
    editors[editorIndex] = { editor, id: editorId, text: editorText, visible: false, lang: "frag", timeout: null, errorMarkers: []};
    editor.setValue(editorText, -1);
    $("#" + editorId).hide();

    editor.session.on("change", (evt) => {
        let editorInfo = editors[editorIndex];
        clearTimeout(editorInfo.timeout);
        setTimeout(() => {
            editorInfo.text = editorInfo.editor.getValue();
            let fragShaderString = headerShader + editorInfo.text;
            let newProgram = twgl.createProgramInfo(gl, ["vs", fragShaderString], (err) => {
                setMarkersForShaderError(editorInfo, err);
                // if(debugging) console.log(err);
            });
            if(newProgram) editorInfo.editor.session.clearAnnotations();
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