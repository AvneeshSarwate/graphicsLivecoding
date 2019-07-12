var fpsMeter = new FPSMeter();

var gui = new dat.GUI();
var controllerProps = { letterTwist: 0, cameraBlend: 0, centerWarp: 0, letterMotion: 0 };
var propToSliderIndex = [['letterTwist', 1], ['cameraBlend', 2], ['centerWarp', 3], ['letterMotion', 5]];
var controllers = propToSliderIndex.map(ps => [gui.add(controllerProps, ps[0], 0, 1).step(0.01), ps[1]]).forEach(cs => cs[0].onChange(v => sliders[cs[1]] = v * 127));