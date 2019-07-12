//make SVG manipulatable via SVG.js library
var svgDoc = SVG.adopt($("#eyebeam")[0]);

const eyeVideo1 = createVideo("eyebeamSVG/eyeblink_004_lower.mp4");
const eyeVideo2 = createVideo("eyebeamSVG/eyeblink_005_lower.mp4");
const eyeVideo3 = createVideo("eyebeamSVG/eyeblink_001_lower.mp4");
const selfieVid = setupWebcam();

svgDoc.size(1920 * rd, 1080 * rd);
svgDoc.viewbox(0, 0, 1920 * rd, 1080 * rd);


//making copies of the initial positions/orientations of the SVG letters
var letters = svgDoc.children()[1].children();
var baseArrays = letters.map(elem => elem.array());
var basePositions = letters.map(letter => ({ x: letter.x() * rd, y: letter.y() * rd }));
letters.forEach((letter, i) => letter.type == "path" ? replaceVH(i, baseArrays, letters) : null);
baseArrays = letters.map(elem => elem.array());
baseArrays = baseArrays.map(letter => letter.map(pt => pt.map(e => typeof e === "number" ? e * rd : e))); //mapping letters into scaled SVG coordinates
var matricies = letters.map(elem => elem.matrixify());
var spin = () => letters.map((p, i) => setTimeout(() => p.animate(500 * 2, "=").rotate(360 * 2), i * 100));

//getting information on the B letters to set borders for boids and shader: name -> [index, element, boundingBox]
var bs = {}
letters.map((letter, i) => [i, letter.classes()]).filter(el => el[1].length > 0).forEach(el => bs[el[1]] = [el[0], letters[el[0]], getBoundingBox(baseArrays[el[0]])])

var swapInfo = randomSwaps(baseArrays, 100);

//creating img and canvas elements used to import the SVG into a WebGL texture
const svgImg = new Image();
const svgCanvas = document.createElement("canvas");
svgCanvas.width = 1920 * rd;
svgCanvas.height = 1080 * rd;
svgCanvas.id = "svgCanvas"
const svgContext = svgCanvas.getContext("2d");

var xmlSerializer = new XMLSerializer();
var dataUrlLen = 0;
//rendering the SVG to a canvas element
function renderSVGtoCanvas() {
    var svg = document.querySelector('svg');

    // get svg data
    var xml = xmlSerializer.serializeToString(svg);

    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';
    dataUrlLen = svg64.length;

    // prepend a "header"
    var image64 = b64Start + svg64;

    // set it as the source of the img element
    svgImg.src = image64;

    // draw the image onto the canvas
    svgImg.onload = () => svgContext.drawImage(svgImg, 0, 0);
}

var flock;
var width = 1920 * rd, height = 1080 * rd;
var vertBorder = 272 * rd, horBorder = 125 * rd;
var gridX = 16, gridY = 5, gridSize = 104 * rd;
var p5Ease = new p5.Ease();
var ease = x => p5Ease.normalizedLogitSigmoid(x, .6);
function pointEase(p1, p2, x) {
    let deltX = p2.x - p1.x;
    let deltY = p2.y - p1.y;
    let easeVal = ease(x);
    let x2 = p1.x + deltX * easeVal;
    let y2 = p1.y + deltY * easeVal;
    return { x: x2, y: y2 };
}

function randCell(returnSVGCoord) {
    let coordMult = returnSVGCoord ? gridSize : 1;
    let rfl = n => Math.floor(Math.random() * n);
    return { x: (1 + rfl(gridX - 1)) * coordMult, y: (1 + rfl(gridY - 1)) * coordMult };
}

function cellToSVGCoord(gridX, gridY) {
    return { x: horBorder + gridX * gridSize, y: vertBorder + gridY * gridSize };
}

function moveBoidSVG(boid, xy) {
    boid.position.x = xy.x;
    boid.position.y = xy.y;
    boid.render();
}

function moveBoidCell(boid, cellXY) {
    let xy = cellToSVGCoord(cellXY.x, cellXY.y);
    moveBoidSVG(boid, xy);
}

function easePoint(p1, p2, x) {
    return mix(p1, p2, ease(x));
}

class easeTask {
    constructor(state, startTime, duration, easeFunc, postFunc) {
        this.state = state;
        this.startTime = startTime;
        this.duration = duration;
        this.easeFunc = easeFunc;
        this.lastEaseTime = 0;

        //todo - this probably doesn't make sense - at best, you can only redo the current task (similar to supercollider repeats)
        this.postFunc = postFunc ? () => null : postFunc;
    }

    eval(time) {
        var easeTime = Math.min(Math.max((time - this.startTime) / this.duration, 0), 1);
        this.lastEaseTime = easeTime;
        var easeFuncVal = this.easeFunc(this.state, easeTime);
        if (lastEaseTime == 1) this.postFunc();
        return easeFuncVal;
    }

    get isDone() {
        return this.lastEaseTime == 1;
    }
}

//empty p5 setup function
function setup() {
    var width = 1920 * rd, height = 1080 * rd;
    flock = new Flock();
    // Add an initial set of boids into the system
    for (let i = 0; i < 20; i++) {
        let rc = randCell(true);
        var svgCreator = r => svgDoc.circle(r).center(horBorder + rc.x, vertBorder + rc.y).fill("rgb(" + ((i + 1) * 10 + 4) + ",0,255)");
        let b = new Boid(horBorder + rc.x, vertBorder + rc.y, svgCreator, width, height, { x: horBorder, y: vertBorder }, gridSize, rd * 3);
        flock.addBoid(b);
    }
    noLoop();
    // flock.run();
    //todo - create  initial easeTask - 
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function randSetSample(n, k) {
    let inds = Array.from(new Array(n), (e, i) => i);
    let shuffleArr = shuffle(inds);
    return shuffleArr.slice(0, k);
}




//playing with SVG colors
svgDoc.children()[0].fill("black");
letters.map(letter => letter.fill("white"));

var refTime = 0;
var time = Date.now() / 1000;
var speedScale = (time) => 1;

//p5 draw loop to do the animation. Am only using p5 as a quick way to get a draw loop - this could be 
//replaced to just use requestAnimationFrame() later
var frameCount = 0;


var assetPromises = [eyeVideo1, eyeVideo2, eyeVideo3, selfieVid];

//use twgl to create textures object here
function handleAssetsAndCreateTextures(eyeVideo1, eyeVideo2, eyeVideo3, selfieVid){
    return twgl.createTextures(gl, {
        svgFrame: { src: svgCanvas },
        eyeVideo1: { src: eyeVideo1 },
        eyeVideo2: { src: eyeVideo2 },
        eyeVideo3: { src: eyeVideo3 },
        selfieVid: { src: selfieVid }
    });
}

function refreshUniforms(){
    var refTime = Date.now() / 1000;
    var increment = Date.now() / 1000 - time;
    time += increment * speedScale(refTime);
    twgl.setTextureFromElement(gl, textures.svgFrame, svgCanvas);
    twgl.setTextureFromElement(gl, textures.eyeVideo1, eyeVideo1);
    twgl.setTextureFromElement(gl, textures.eyeVideo2, eyeVideo2);
    twgl.setTextureFromElement(gl, textures.eyeVideo3, eyeVideo3);
    twgl.setTextureFromElement(gl, textures.selfieVid, selfieVid);
}

function getPass1Uniforms(){
    return {
        time: time * 0.001,
        resolution: [gl.canvas.width, gl.canvas.height],
        svgFrame: textures.svgFrame,
        eyeVideo1: textures.eyeVideo1,
        eyeVideo2: textures.eyeVideo2,
        eyeVideo3: textures.eyeVideo3,
        selfieVid: textures.selfieVid,
        backbuffer: frameBuffers[frameBufferIndex].attachments[0],
        circlePositions: flock.boids.map(b => [b.position.x, b.position.y]).flat(),
        circleRadii: flock.boids.map(b => b.svgElement.ry()),
        cameraBlend: sliders[2] / 127,
        feedbackRotation: sliders[1] / 127,
        rd: rd
    };
}

function getPass2Uniforms(){
    return {
        time: time * 0.001,
        resolution: [gl.canvas.width, gl.canvas.height],
        lastStage: frameBuffers[(frameBufferIndex + 1) % 2].attachments[0],
        warpSlider: sliders[3] / 127,
        baseCutSlider: sliders[4] / 127
    }
}