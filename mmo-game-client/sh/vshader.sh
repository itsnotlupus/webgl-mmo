
attribute vec3 aVerPosition;
attribute vec3 aVerNormal;
attribute vec2 aTexCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uAmbientColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;

uniform bool uUseLighting;

varying vec2 vTexCoord;
varying vec3 vLightWeighting;

void main()
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVerPosition, 1.0);
    vTexCoord = aTexCoord;

    if (!uUseLighting) {
        vLightWeighting = vec3(1.0, 1.0, 1.0);
    } else {
        vec3 transformedNormal = uNMatrix * aVerNormal;
        float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
        vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
    }
}
