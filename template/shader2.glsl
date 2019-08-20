uniform sampler2D lastStage;
uniform sampler2D p5;


out vec4 fragColor;
void main () {
    vec2 stN = uvN();
    vec4 pos = texture(lastStage, stN);
    vec3 col = texture(p5, pos.rg).rgb;


    fragColor = vec4(col, 1);
}