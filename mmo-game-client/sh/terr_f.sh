#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec3 vLightWeight;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform sampler2D uTex2;

void main()
{
    vec4 tex0 = texture2D(uTex0, vTexCoord);
    vec2 ntc = vTexCoord * 20.0;
    vec4 tex1 = texture2D(uTex1, ntc);
    vec4 tex2 = texture2D(uTex2, ntc);
    vec4 texColor = clamp(tex1*tex0.s + tex2*tex0.t, 0.0, 1.0);
    gl_FragColor = vec4(texColor.rgb * vLightWeight, 1.0);
}
