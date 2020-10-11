uniform sampler2D lastStage;
uniform sampler2D p5;

vec3 ballTwist(vec2 stN, float t2, float numBalls, float rad, float twist){ 
    vec2 warp = stN;
    

    
    for (float i = 0.0; i < 100.; i++) {
        if(i == numBalls) break;
        vec2 p = vec2(sinN(t2* rand(i+1.) * 1.3 + i), cosN(t2 * rand(i+1.) * 1.1 + i));
        // warp = length(p - stN) <= rad ? mix(p, warp, length(stN - p)/rad)  : warp;
        warp = length(p - stN) <= rad ? rotate(warp, p, (1.-length(stN - p)/rad)  * twist * sinN(1.-length(stN - p)/rad * PI)) : warp;
    }
    
    return vec3(warp, distance(warp, stN));
}

vec3 coordWarp(vec2 stN, float t2){ 
    vec2 warp = stN;
    
    float rad = .5;
    
    for (float i = 0.0; i < 40.; i++) {
        vec2 p = vec2(sinN(t2* rand(i+1.) * 1.3 + i), cosN(t2 * rand(i+1.) * 1.1 + i));
        warp = length(p - stN) <= rad ? mix(warp, p, 1. - length(stN - p)/rad)  : warp;
    }
    
    return vec3(warp, distance(warp, stN));
}

// same as above but for vectors, applying the quantization to each element
vec2 quant(vec2 num, float quantLevels){
    vec2 roundPart = floor(fract(num*quantLevels)*2.);
    return (floor(num*quantLevels)+roundPart)/quantLevels;
}


out vec4 fragColor;
void main () {
    vec2 stN = uvN();
    vec3 warpN = coordWarp(stN,  time/10.+120.);
    vec4 pos = texture(lastStage, quant(mix(stN, warpN.xy, sliderVals[6]), 1000.*pow(1.-sliderVals[5],2.)) );
    vec3 col = texture(p5, mix(pos.rg, pos.ba, 0.1)).rgb;
    vec4 bb = texture(backbuffer, mix(stN, warpN.xy, .05));
    


    fragColor = pos; //vec4(mix(col, bb.rgb, 0.9), 1);
}