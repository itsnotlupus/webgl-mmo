#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec3 vLightWeighting;

uniform sampler2D uSampler;
uniform bool uUseTextures;

void main()
{
    if (uUseTextures) {
        vec4 texColor = texture2D(uSampler, vTexCoord);
        gl_FragColor = vec4(texColor.rgb * vLightWeighting, texColor.a);
    } else {
        gl_FragColor = vec4(vLightWeighting, 1.0);
    }
}
