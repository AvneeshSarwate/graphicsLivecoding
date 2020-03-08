console.log("controllers.js eval");

var gui = new dat.GUI();

//adds a slider to datGUI with the specified string and binds it to a midi value as well
function addGUISlider(label){

}

// Enable WebMidi.js
WebMidi.enable(function (err) {

    if (err) {
        console.log("WebMidi could not be enabled.", err);
    } else {
        // Retrieve an input by name, id or index
        var input = WebMidi.getInputByName("TouchOSC Bridge");

        // Listen for a 'cc' message on all channels
        input.addListener('controlchange', "all", function (e) {
            sliders[e.controller.number] = e.value/127;
            handleSiteFunctionLerpMidi(e.controller.number, e.value);
        });
    }
});