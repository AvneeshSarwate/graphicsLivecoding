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


uniform sampler2D lastStage;
uniform float warpSlider;
uniform float baseCutSlider;

out vec4 fragColor;

//hardcoded for now, could be made uniforms
float lsX = 125.; //letter width
float lsY = 272.; //letter width
float h = 1080.;
float w = 1920.;

vec2 resposition(vec2 nn, float x, float y, float size){
    float x2 = x+size;
    float y2 = y+size;
    return vec2(clamp((nn.x - x) / (x2 - x), 0.0, 1.0), clamp((nn.y - y) / (y2 - y), 0.0, 1.0));
}

bool inBox(vec2 nn, float x1, float x2, float y1, float y2){
    return x1 < nn.x && nn.x < x2 && y1 < nn.y && nn.y < y2; 
}

float interp(float c, float a, float b, float y, float z){
    return (c - a) * (z - y) / (b - a) + y;
}

void main () {
    vec2 stN = uvN();

    float xOffset = 0.3;
    float yOffset = 0.3;
    vec2 projectionScale = vec2(mix(stN.x, interp(stN.x, 0., 1., xOffset, 1.-xOffset), stN.y),  mix(stN.y, interp(stN.y, 0., 1., yOffset, 1.-yOffset), stN.x));  
    bool isInScale = xOffset < stN.x && stN.x < 1. - xOffset && yOffset < stN.y && stN.y < 1. - yOffset;

    vec2 sampN = stN;
    vec2 cent = vec2(0.5); 

    
    
    vec2 transN = vec2(mod(sampN.x + time/5., 1.), mod(sampN.y + sin(time/2.5*PI + sampN.x*PI)*0.1, 1.));
    bool isInBox = inBox(stN, lsX/w, (w-lsX)/w, lsY/h, (h-lsY)/h);

    // vec2 warpN = mix(sampN, coordWarp(sampN, time).xy, float(isInBox)*sinN(time/2.));
    float noiseRes = 10.;
    float devShrink = 10.;
    float noiseSpeed = .3;
    vec2 warpN = sampN + vec2(snoise(vec3(sampN*noiseRes, time*noiseSpeed)), snoise(vec3(sampN*noiseRes, time*noiseSpeed+14.)))/devShrink;
    float warpMix = .5 * warpSlider; sinN(time/2.);
    warpN = mix(sampN, warpN, warpMix * float(isInBox));

    vec3 col = texture(lastStage, warpN).rgb;
    col = mix(black, col, float(stN.y > baseCutSlider));

    float dist = distance(projectionScale, stN);
    // col = mix(red, col, float(isInScale));

    fragColor = vec4(vec3(col), 1);
}