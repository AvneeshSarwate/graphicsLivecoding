
uniform sampler2D lastStage;
uniform float warpSlider;

out vec4 fragColor;

void main () {
    vec2 stN = uvN();
    vec2 sampN= vec2(stN.x, stN.y);
    vec2 cent = vec2(0.5); 

    float xOffset = 0.1;
    float yOffset = 0.1;
    vec2 projectionScale = vec2(mix(stN.x, (stN.x-xOffset)/(1.-2*xOffset), stN.x),  mix(stN.y, (stN.y-yOffset)/(1.-2*yOffset), stN.y));  

    vec3 col = texture(lastStage, projectionScale).rgb;

    fragColor = vec4(col, 1);
}