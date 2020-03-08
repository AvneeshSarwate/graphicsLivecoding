(
var launchpad, launchpadOut, oscBrowserPort, padToAnimationMap;

var launchpadIndex = 0;
launchpad = ~getLaunchpadIn.(launchpadIndex);
launchpadOut = ~getLaunchpadOut.(launchpadIndex);
launchpadOut.latency = 0;

oscBrowserPort = NetAddr("localhost", 5432);

padToAnimationMap = Dictionary.new;

(0..99).do({|i|
    padToAnimationMap = 0; //-1 is on but noAnimation, 0 is  off, 1-n are animations
});

MIDIFunc.noteOn({|vel, note, chan, port|

}, nil, nil, launchpad.uid);


MIDIFunc.cc({|vel, note, chan, port|

}, nil, nil, launchpad.uid);




)

