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

out vec4 fragColor;
void main () {
    vec2 stN = uvN();
    vec2 cent = vec2(0.5);
    vec3 warpN = ballTwist(stN,  time/10.+120., 10., .9, .5);
    vec4 bb = texture(backbuffer, mix(stN, warpN.xy, .05));

    fragColor = vec4(mix(bb.rg, stN, 0.005), stN);
}