#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec3 vLightWeight;

uniform sampler2D uSampler;
uniform bool uUseTextures;

void main()
{
    if (uUseTextures) {
        vec4 texColor = texture2D(uSampler, vTexCoord);
        gl_FragColor = vec4(texColor.rgb * vLightWeight, texColor.a);
    } else {
        gl_FragColor = vec4(vLightWeight, 1.0);
    }
}
