

(

/*NOTES
-- in trigger_MODE - hitting the button of an animation triggers all pannels with that animation

-- toggle for INSTANT option in assign mode, where you can add a new point with the current
-- animation index AND it will fire (or if you over-write a current mode, it will also fire)

*/

var launchpad, launchpadOut, oscBrowserPort, padToAnimationMap, padMode, toggle_MODE, assign_MODE, trigger_MODE, toggleMode_BUTTON, assignMode_BUTTON, triggerMode_BUTTON, padMode_BUTTONS, padMode_COLOR, noAnimation_COLOR, animation_COLORS, animation_BUTTONS, selectedAnimationIndex, bankMap, bankSaveMode, bank_BUTTONS, bankSave_BUTTON, bankSave_COLOR;

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


bankSave_BUTTON = 59;
bankSave_COLOR = 5;
bankSaveMode = false;
bank_BUTTONS = [1, 2, 3, 4, 5, 6, 7, 8] * 10;
bankMap = Dictionary.new;


animation_BUTTONS = (1..8);
selectedAnimationIndex = 0;
(0..7).do({|i| launchpadOut.noteOn(0, animation_BUTTONS[i], animation_COLORS[i])});

(0..99).do({|i|
    padToAnimationMap[i] = -1; //-1 is off, 0 is  no-animation, 1-n are animations
});

MIDIFunc.noteOn({|vel, note, chan, port|
    if(padMode == toggle_MODE, {
        if(padToAnimationMap[note] == -1, {
            padToAnimationMap[note] = 0;
            //send message to js adding note
            launchpadOut.noteOn(0, note, noAnimation_COLOR);
        }, {
            padToAnimationMap[note] = -1;
            launchpadOut.noteOff(0, note);
        });
        oscBrowserPort.sendMsg("/padSiteMap", JSON.stringify(padToAnimationMap));
    });
    if(padMode == assign_MODE, {
        if(padToAnimationMap[note] != -1, {
            padToAnimationMap[note] = selectedAnimationIndex;
            launchpadOut.noteOn(0, note, animation_COLORS[selectedAnimationIndex]);
        });

        oscBrowserPort.sendMsg("/animationAssign", note, selectedAnimationIndex);
    });

    if(padMode == trigger_MODE, {
        var animInd = padToAnimationMap[note];
        if(animInd != -1, {
            oscBrowserPort.sendMsg("/animationTrigger", note, animInd);
        });
    });


}, nil, nil, launchpad.uid);


MIDIFunc.cc({|vel, note, chan, port|
    if(padMode_BUTTONS.includes(note) && (vel != 0), {
        var buttonColor;
        padMode = note;
        padMode_BUTTONS.do({|b| launchpadOut.noteOff(0, b)});
        buttonColor = if(note == assignMode_BUTTON, animation_COLORS[selectedAnimationIndex], padMode_COLOR);
        launchpadOut.noteOn(0, note, buttonColor);
    });

    if(animation_BUTTONS.includes(note) && (vel != 0), {
        if(padMode == assign_MODE, {
            selectedAnimationIndex = animation_BUTTONS.indexOf(note);
            launchpadOut.noteOn(0, assignMode_BUTTON, animation_COLORS[selectedAnimationIndex]);
        });
        if(padMode == trigger_MODE, {
            padToAnimationMap.keys.do({|k|
                var v = padToAnimationMap[k];
                if(v == animation_BUTTONS.indexOf(note), {
                    oscBrowserPort.sendMsg("/animationTrigger", k, v);
                });
            });
        });
    });
    if(bank_BUTTONS.includes(note) && (vel != 0), {
        if(bankSaveMode, {
            bankMap[note] =  padToAnimationMap.copy;
            launchpadOut.noteOn(0, note, noAnimation_COLOR);
        },{
            if(bankMap.keys.includes(note), {
                padToAnimationMap = bankMap[note].copy;
                padToAnimationMap.keys.do({|k|
                    var isPad = (1..8).includes(k%10) && (((k/10).floor >=1) && ((k/10).floor <= 8));
                    var val = padToAnimationMap[k];
                    // ["BANK LIGHT", k, isPad, (1..8).includes(k%10), (1..8).includes((k/10).floor)].postln;
                    if(isPad, {
                        launchpadOut.noteOn(0, k, if(val == -1, 0, animation_COLORS[val]));
                    });
                });
                oscBrowserPort.sendMsg("/padSiteMap", JSON.stringify(padToAnimationMap));
            });
        });
    });
    if((note == bankSave_BUTTON) && (vel != 0), {
        bankSaveMode = bankSaveMode.not;
        launchpadOut.noteOn(0, note, if(bankSaveMode, bankSave_COLOR, 0));
    });

}, nil, nil, launchpad.uid);

)



