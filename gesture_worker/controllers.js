console.log("controllers.js eval");

var gui = new dat.GUI();
var sliderObj = {};
arrayOf(10).forEach((e, i) => {
    sliderObj['slider'+i] = 0;
    gui.add(sliderObj, 'slider'+i, 0, 1, 0.001).onChange(v => {sliders[i] = v});
});
//adds a slider to datGUI with the specified string and binds it to a midi value as well


// Enable WebMidi.js
WebMidi.enable(function (err) {

    if (err) {
        console.log("WebMidi could not be enabled.", err);
    } else {
        // Retrieve an input by name, id or index
        // var input = WebMidi.getInputByName("TouchOSC Bridge");

        // // Listen for a 'cc' message on all channels
        // input.addListener('controlchange', "all", function (e) {
        //     sliders[e.controller.number] = e.value/127;
        //     handleSiteFunctionLerpMidi(e.controller.number, e.value);
        // });
    }
});