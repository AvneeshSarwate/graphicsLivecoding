uniform sampler2D lastStage;

out vec4 fragColor;
void main () {
    vec2 stN = uvN();
    vec3 col = texture(lastStage, stN).rgb;

    fragColor = vec4(col, 1);
}