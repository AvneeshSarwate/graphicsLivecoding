// quantize and input number [0, 1] to quantLevels levels
float quant(float num, float quantLevels){
    float roundPart = floor(fract(num*quantLevels));
    return (floor(num*quantLevels)+roundPart)/quantLevels;
}

// same as above but for vectors, applying the quantization to each element
vec3 quant(vec3 num, float quantLevels){
    vec3 roundPart = floor(fract(num*quantLevels)*2.);
    return (floor(num*quantLevels)+roundPart)/quantLevels;
}

// same as above but for vectors, applying the quantization to each element
vec2 quant(vec2 num, float quantLevels){
    vec2 roundPart = floor(fract(num*quantLevels)*2.);
    return (floor(num*quantLevels)+roundPart)/quantLevels;
}

/* bound a number to [low, high] and "wrap" the number back into the range
if it exceeds the range on either side - 
for example wrap(10, 1, 9) -> 8
and wrap (-2, -1, 9) -> 0
*/
float wrap3(float val, float low, float high){
    float range  = high - low;
    if(val > high){
        float dif = val-high;
        float difMod = mod(dif, range);
        float numWrap = dif/range - difMod;
        if(mod(numWrap, 2.) == 0.){
            return high - difMod;
        } else {
            return low + difMod;
        }
    }
    if(val < low){
        float dif = low-val;
        float difMod = mod(dif, range);
        float numWrap = dif/range - difMod;
        if(mod(numWrap, 2.) == 0.){
            return low + difMod;
        } else {
            return high - difMod;
        }
    }
    return val;
}
vec2 wrap(vec2 val, float low, float high){
    return vec2(wrap3(val.x, low, high), wrap3(val.y, low, high));
}

//slice the matrix up into columns and translate the individual columns in a moving wave
vec2 columnWaves3(vec2 stN, float numColumns, float time2, float power){
    return vec2(wrap3(stN.x + sin(time2*8.)*0.05 * power, 0., 1.), wrap3(stN.y + cos(quant(stN.x, numColumns)*5.+time2*2.)*0.22 * power, 0., 1.));
}

//slice the matrix up into rows and translate the individual rows in a moving wave
vec2 rowWaves3(vec2 stN, float numColumns, float time2, float power){
    return vec2(wrap3(stN.x + sin(quant(stN.y, numColumns)*5.+time2*2.)*0.22 * power, 0., 1.), wrap3(stN.y + cos(time2*8.)*0.05 * power, 0., 1.));
}


//iteratively apply the rowWave and columnWave functions repeatedly to 
//granularly warp the grid
vec2 rowColWave(vec2 stN, float div, float time2, float power){
    for (int i = 0; i < 10; i++) {
        stN = rowWaves3(stN, div, time2, power);
        stN = columnWaves3(stN, div, time2, power);
    }
    return stN;
}

vec4 colormap_hsv2rgb(float h, float s, float v) {
    float r = v;
    float g = v;
    float b = v;
    if (s > 0.0) {
        h *= 6.0;
        int i = int(h);
        float f = h - float(i);
        if (i == 1) {
            r *= 1.0 - s * f;
            b *= 1.0 - s;
        } else if (i == 2) {
            r *= 1.0 - s;
            b *= 1.0 - s * (1.0 - f);
        } else if (i == 3) {
            r *= 1.0 - s;
            g *= 1.0 - s * f;
        } else if (i == 4) {
            r *= 1.0 - s * (1.0 - f);
            g *= 1.0 - s;
        } else if (i == 5) {
            g *= 1.0 - s;
            b *= 1.0 - s * f;
        } else {
            g *= 1.0 - s * (1.0 - f);
            b *= 1.0 - s;
        }
    }
    return vec4(r, g, b, 1.0);
}

vec4 colormap(float x) {
    float h = clamp(-7.44981265666511E-01 * x + 7.47965390904122E-01, 0.0, 1.0);
    float s = 1.0;
    float v = 1.0;
    return colormap_hsv2rgb(h, s, v);
}

float colourDistance(vec3 e1, vec3 e2) {
  float rmean = (e1.r + e2.r ) / 2.;
  float r = e1.r - e2.r;
  float g = e1.g - e2.g;
  float b = e1.b - e2.b;
  return sqrt((((512.+rmean)*r*r)/256.) + 4.*g*g + (((767.-rmean)*b*b)/256.));
}

vec4 circleSlice(vec2 stN, float t, float randw){
    
    //define several different timescales for the transformations
    float t0, t1, t2, t3, t4, rw;
    t0 = t/4.5;
    t1 = t/2.1;
    t2 = t/1.1;
    t3 = t/0.93;
    rw =  randw/290.; //a random walk value used to parameterize the rotation of the final frame
    t4 = t;
    
    t1 = t1 / 2.;
    t0 = t0 / 2.;
    rw = rw / 2.;
    float divx = sinN(t0) * 120.+10.;
    float divy = cosN(t1) * 1400.+10.;
    stN = stN * rotate(stN, vec2(0.5), rw);
    vec2 trans2 = vec2(mod(floor(stN.y * divx), 2.) == 0. ? mod(stN.x + (t1 + rw)/4., 1.) : mod(stN.x - t1/4., 1.), 
                       mod(floor(stN.x * divy), 2.) == 0. ? mod(stN.y + t1, 1.) : mod(stN.y - t1, 1.));
    
    
    bool inStripe = false;
    float dist = distance(trans2, vec2(0.5));


    float numStripes = 20.;
    float d = 0.05;
    float stripeWidth =(0.5 - d) / numStripes;
    for(int i = 0; i < 100; i++){
        if(d < dist && dist < d + stripeWidth/2.) {
            inStripe = inStripe || true;
        } else {
            inStripe = inStripe || false;
        }
        d = d + stripeWidth;
        if(d > 0.5) break;
    }
    
    vec4 c = !inStripe ? vec4(white, 1) : vec4(black, 0);
    return c;
    
}

vec3 coordWarp(vec2 stN, float t2){ 
    vec2 warp = stN;
    
    float rad = .5;
    
    for (float i = 0.0; i < 20.; i++) {
        vec2 p = vec2(sinN(t2* rand(i+1.) * 1.3 + i), cosN(t2 * rand(i+1.) * 1.1 + i));
        warp = length(p - stN) <= rad ? mix(p, warp, length(stN - p)/rad)  : warp;
    }
    
    return vec3(warp, distance(warp, stN));
}

vec2 multiBallCondition(vec2 stN, float t2){
    
    float rad = .08;
    bool cond = false;
    float ballInd = -1.;
    
    for (int i = 0; i < 20; i++) {
        float i_f = float(i);
        vec2 p = vec2(sinN(t2 * rand(vec2(i_f+1., 10.)) * 1.3 + i_f), cosN(t2 * rand(vec2(i_f+1., 10.)) * 1.1 + i_f));
        cond = cond || distance(stN, p) < rad;
        if(distance(stN, p) < rad) ballInd = float(i); 
    }
    
    return vec2(cond ? 1. :0., ballInd/20.);
}

vec3 inStripeX(vec2 stN, float rw){
    bool inStripe = false;
    for(float i = 0.; i < 40.; i++){
        float seed = 1./i;
        float loc = mod(hash(vec3(seed)).x + rw, 1.);
        if(abs(loc - stN.x) < 0.002) inStripe = inStripe || true;
    }
    return inStripe ? black : white;
}

vec3 inStripeY(vec2 stN, float t){
    bool inStripe = false;
    for(float i = 0.; i < 40.; i++){
        float seed = 1./i;
        float loc = mod(hash(vec3(seed)).x + t, 1.);
        if(abs(loc - stN.y) < 0.002) inStripe = inStripe || true;
    }
    return inStripe ? black : white;
}

vec3 inStripeX2(vec2 stN, float rw){
    float inStripe = 0.;
    vec2 stN0 = stN;
    for(float i = 0.; i < 40.; i++){
        float seed = 1./i;
        stN = rotate(stN0, vec2(0.5), 0.2 * sin(rw+ i*50.));
        float loc = mod(hash(vec3(seed)).x + sinN(rw*seed*5. + seed) * i/5., 1.);
        inStripe += float(abs(loc - stN.x) < rand(seed)*0.005 + 0.001);
    }
    return mix(black, white, 1.-sign(inStripe));
}

vec3 inStripeY2(vec2 stN, float t){
    float inStripe = 0.;
    vec2 stN0 = stN;
    for(float i = 0.; i < 40.; i++){
        float seed = 1./i;
        stN = rotate(stN0, vec2(0.5), 0.2 * sin(t+ i*50.));
        float loc = mod(hash(vec3(seed)).x + sinN(t*seed*5. + seed) * i/5., 1.);
        inStripe += float(abs(loc - stN.y) < rand(seed)*0.005  + 0.001);
    }
    return mix(black, white, 1.-sign(inStripe));
}

vec2 xLens(vec2 stN, float rw){
    bool inStripe = false;
    vec2 stN0 = stN;
    vec2 coord = stN;
    float lensSize = 0.05;
    for(float i = 0.; i < 40.; i++){
        float seed = 1./i;
        stN = rotate(stN0, vec2(0.5), 0.3 * sin(rw+ i*50.));
        float loc = mod(hash(vec3(seed)).x + sinN(rw*seed*5. + seed) * i/5., 1.);
        if(abs(loc - stN.x) < lensSize) coord = vec2(mix(loc, coord.x, abs(loc - stN.x)/lensSize), coord.y);
    }
    return coord;
}

vec2 yLens(vec2 stN, float t){
    bool inStripe = false;
    vec2 stN0 = stN;
    vec2 coord = stN;
    float lensSize = 0.05;
    for(float i = 0.; i < 40.; i++){
        float seed = 1./i;
        stN = rotate(stN0, vec2(0.5), 0.3 * sin(t+ i*50.));
        float loc = mod(hash(vec3(seed)).x + sinN(t*seed*5. + seed) * i/5., 1.);
        if(abs(loc - stN.y) < lensSize) coord = vec2(coord.x, mix(loc, coord.y, abs(loc - stN.y)/lensSize));
    }
    return coord;
}

// calculates the luminance value of a pixel
// formula found here - https://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color 
vec3 lum(vec3 color){
    vec3 weights = vec3(0.212, 0.7152, 0.0722);
    return vec3(dot(color, weights));
}

float minDistToBorder(vec2 stN){
    float vert = min(stN.y, abs(1.-stN.y));
    float hor = min(stN.x, abs(1.-stN.x));
    return min(vert, hor);
}


uniform sampler2D svgFrame;
uniform sampler2D eyeVideo1;
uniform sampler2D eyeVideo2;
uniform sampler2D eyeVideo3;
uniform sampler2D selfieVid;
int numCircles = 10;
uniform vec2 circlePositions[20];
uniform float circleRadii[20];
uniform float cameraBlend;
uniform float feedbackRotation;

out vec4 fragColor;

uniform float rd; //image downscaling factor (same as in JS for SVG)

vec3 traffic(vec2 stN, vec3 params){
    float timeScale = 0.3;
    float t2 = params.x* PI * timeScale; 
    float t3 = time/5. * timeScale;
    float t4 = time * timeScale;
    float rad = params.y;
    vec2 warp1 = vec2(-1., 1.);
    vec2 warp2 = vec2(0.5, 0.);
    vec2 warpXY = mix(warp1, warp2, params.z);
    stN = mix(stN, rotate(stN, vec2(0.5) + sin(t4)*rad, t3), sinN(stN.x*PI*(1.+sinN(t2/2.)*5.) + t2*3.) * warpXY.x*2.);
    stN = mix(stN, rotate(stN, vec2(0.5) + cos(t4)*rad, t3), sinN(stN.y*PI*(1.+sinN(t2/2.)*5.) + t2*3.) * warpXY.y *2.);
    // stN = mix(stN, rotate(stN, vec2(0.5), t2), sinN((distance(stN, vec2(0.5))+0.01)*PI*(1.+sinN(t2/2.)*5.) + t2*3.) * sin(time)*2.);
    // t2 = time;
    // stN = mix(stN, rotate(stN, vec2(0.5), t2), sinN(stN.x*PI*(1.+sinN(t2/2.)*5.) + t2*3.));
    // stN = rotate(stN, vec2(0.5), abs(stN.x-0.5) * abs(stN.y-0.5));

    
    //take2
    float timeVal = time * timeScale +3000.;
    stN = quant(stN, 200.);
    vec2 stN2 = rotate(stN, vec2(0.5), time/2.);
    vec3 c = inStripeX2(stN, timeVal/10. * (.5 + stN.x)) * inStripeY2(stN, timeVal/7. * (.5 + stN.y));
    return c;
}

vec3 matrixCam () {
    float t2 = time/5. + 1000.;

    vec2 stN = uvN();
    stN = quant(stN, 600.);
    float numCells = 400.;
    
    vec3 cam = texture(selfieVid, 1.-stN).rgb;

    vec2 hashN = stN + (cam.xy-0.5)/numCells;(hash(vec3(stN, t2)).xy + -0.5)/numCells;
    // hashN = quant(hashN, 600.);

    vec3 cc;
    float decay = 0.999;
    float decay2 = 0.01;
    float feedback;
    vec4 bb = texture(backbuffer, quant(hashN, 600.));
    float lastFeedback = bb.a;

    // vec2 multBall = multiBallCondition(stN, t2/2.);
    bool condition = mod(stN.x*numCells, 1.) < sinN(time + stN.x*PI) || mod(stN.y*numCells, 1.) < cosN(time + stN.y*PI); //multBall.x == 1.; 
    condition = distance(quant(hashN, numCells) + vec2(sinN(t2), cosN(t2))/numCells/2. - 1./numCells/4., hashN) < 1./(numCells*10.);

    //   implement the trailing effectm using the alpha channel to track the state of decay 
    if(condition){
        if(lastFeedback < .9) {
            feedback = 1. ;// * multBall.y;
        } else {
            // feedback = lastFeedback * decay;
            feedback = lastFeedback - decay2;
        }
    }
    else {
        // feedback = lastFeedback * decay;
        feedback = lastFeedback - decay2;
    }
    
    vec3 col = vec3(feedback);

    return col;
}

bool inBox(vec2 nn, float x1, float x2, float y1, float y2){
    return x1 < nn.x && nn.x < x2 && y1 < nn.y && nn.y < y2; 
}

void main () {
    //hardcoded for now, could be made uniforms
    float lsX = 125.*rd; //letter width
    float lsY = 272.*rd; //letter width
    float h = 1080.*rd;
    float w = 1920.*rd;

    vec2 stN = uvN();
    vec2 sampN= vec2(stN.x, 1.-stN.y);
    vec2 cent = vec2(0.5); 

    
    
    vec2 transN = vec2(mod(sampN.x + time/5., 1.), mod(sampN.y + sin(time/2.5*PI + sampN.x*PI)*0.1, 1.));
    bool isInBox = inBox(stN, lsX/w, (w-lsX)/w, lsY/h, (h-lsY)/h);
    vec3 svg = texture(svgFrame, mix(sampN, transN, 0.0)).rgb; 
    vec3 bb = texture(backbuffer, rotate(stN, cent, 0.005 * feedbackRotation)).rgb;
    vec3 bbN = texture(backbuffer, stN).rgb;

    vec3 col = (mix(bb, svg, 0.2)+svg)*(1.+sin(time/2.+stN.x*PI)*0.01);
    col = mix(bb, svg, 0.09);
    col = mix(col, svg, float(isInBox));

    int ci = max(min(int(floor((svg.r*255./10.))-1.), 19), 0);
    vec2 flipFragCoord = vec2(gl_FragCoord.x, resolution.y-gl_FragCoord.y);
    vec2 flipCirlce = vec2(circlePositions[ci].x, h-circlePositions[ci].y);
    bool isInCircle = distance(flipCirlce*resolution/vec2(w, h), gl_FragCoord.xy) < circleRadii[ci]*max(resolution.x/w, resolution.y/h)*1.2;
    bool isNotBackground = svg.b != 0.;
    col = mix(col, traffic(stN, hash(vec3(5.3, 45., float(ci)))), float(isInCircle && isInBox && isNotBackground));
    vec2 fcFlipped = vec2(gl_FragCoord.x, resolution.y -gl_FragCoord.y);

    
    vec2 mappedEyeCenter = (gl_FragCoord.xy - flipCirlce*resolution/vec2(w, h))/resolution*9. + vec2(0.6, 0.5);
    vec3 mappedEye = texture(eyeVideo1, vec2(mappedEyeCenter.x, 1.-mappedEyeCenter.y)).rgb;
    col = mix(col, mappedEye, float(ci > 9) * float(ci % 5 == 0) * float(isInCircle && isInBox && isNotBackground));

    mappedEyeCenter = (gl_FragCoord.xy - flipCirlce*resolution/vec2(w, h))/resolution*9. + vec2(0.6, 0.5);
    mappedEye = texture(eyeVideo2, vec2(mappedEyeCenter.x, 1.-mappedEyeCenter.y)).rgb;
    col = mix(col, mappedEye, float(ci > 9) * float(ci % 5 == 1) * float(isInCircle && isInBox && isNotBackground));

    mappedEyeCenter = (gl_FragCoord.xy - flipCirlce*resolution/vec2(w, h))/resolution*9. + vec2(0.6, 0.5);
    mappedEye = texture(eyeVideo3, vec2(mappedEyeCenter.x, 1.-mappedEyeCenter.y)).rgb;
    col = mix(col, mappedEye, float(ci > 9) * float(ci % 5 == 2) * float(isInCircle && isInBox && isNotBackground));


    float noiseWarp = snoise(vec3(stN*5., time));
    float bgBlendSlider = cameraBlend; sinN(time/3.);
    float bgBlend = mix(noiseWarp*mix(0., 4., bgBlendSlider), 1., bgBlendSlider);
    // col = mix(col, vec3(1., 0, 0), bgBlend * float(isInBox && ! isNotBackground));

    vec3 matrix = matrixCam();
    col = mix(col, matrix, bgBlend * float(isInBox && ! isNotBackground));

    // vec3 bgTraffic = 1. -traffic(stN, vec3(3., 0., .0));
    // col = mix(col, bgTraffic, float(isInBox && !isNotBackground));

    // col = mix(col, bgTraffic, float(isInBox && !isNotBackground));

    // col = mix(col, mix(bb, col, 0.3), float(isInBox));

    // vec3 debugCol = vec3(float(ci == 9));
    // col = mix(red, svg, 1.-float(isInBox));
    bool isInEye1 = distance(vec2(0.6, 0.5)*resolution, gl_FragCoord.xy) < 400. * max(resolution.x/w, resolution.y/h);
    vec3 eye1 = texture(eyeVideo1, sampN).rgb;
    vec3 eyeCrop = mix(black, eye1, float(isInEye1));

    fragColor = vec4(col, matrix.x);
}