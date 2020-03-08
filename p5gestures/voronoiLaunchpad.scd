

(

/*NOTES
-- in trigger_MODE - hitting the button of an animation triggers all pannels with that animation

*/

var launchpad, launchpadOut, oscBrowserPort, padToAnimationMap, padMode, toggle_MODE, assign_MODE, trigger_MODE, toggleMode_BUTTON, assignMode_BUTTON, triggerMode_BUTTON, padMode_BUTTONS, padMode_COLOR, noAnimation_COLOR, animation_COLORS, animation_BUTTONS, selectedAnimationIndex;

var launchpadIndex = 1;
launchpad = ~getLaunchpadIn.(launchpadIndex);
launchpadOut = ~getLaunchpadOut.(launchpadIndex);
launchpadOut.latency = 0;

oscBrowserPort = NetAddr("localhost", 5432);


(0..99).do({|i| launchpadOut.noteOff(0, i)});


padToAnimationMap = Dictionary.new;

toggleMode_BUTTON = 89;
toggle_MODE = 89;
assignMode_BUTTON = 79;
assign_MODE = 79;
triggerMode_BUTTON = 69;
trigger_MODE = 69;
padMode_BUTTONS = [toggleMode_BUTTON, assignMode_BUTTON, triggerMode_BUTTON];
padMode_COLOR = 53;

padMode = toggle_MODE;
launchpadOut.noteOn(0, toggleMode_BUTTON, padMode_COLOR);

noAnimation_COLOR = 3;

animation_COLORS = ([0, 1, 2, 3, 4, 5, 6, 7] * 8) + 1;
animation_COLORS[0] = noAnimation_COLOR;


animation_BUTTONS = (1..8);
selectedAnimationIndex = 0;
(0..7).do({|i| launchpadOut.noteOn(0, animation_BUTTONS[i], animation_COLORS[i])});

(0..99).do({|i|
    padToAnimationMap = 0; //-1 is on but noAnimation, 0 is  off, 1-n are animations
});

MIDIFunc.noteOn({|vel, note, chan, port|
    if(padMode == toggle_MODE, {
        padToAnimationMap[note] = -1;
        //send message to js adding note
        launchpadOut.noteOn(0, note, noAnimation_COLOR);
    });
    if(padMode == assign_MODE, {

    });
    if(padMode == trigger_MODE, {

    });


}, nil, nil, launchpad.uid);


MIDIFunc.cc({|vel, note, chan, port|
    if(padMode_BUTTONS.includes(note), {
        var buttonColor;
        padMode = note;
        padMode_BUTTONS.do({|b| launchpadOut.noteOff(0, b)});
        buttonColor = if(note == assignMode_BUTTON, animation_COLORS[selectedAnimationIndex], padMode_COLOR);
        launchpadOut.noteOn(0, note, buttonColor);
    });

}, nil, nil, launchpad.uid);




)

[1, 2, 3].includes(3)