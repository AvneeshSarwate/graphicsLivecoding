uniform sampler2D p5;

out vec4 fragColor;
void main () {
    vec2 stN = uvN();
    vec3 p5col = texture(p5, stN).rgb;

    fragColor = vec4(p5col, 1);
}