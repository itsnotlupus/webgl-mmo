
attribute vec3 aVerPosition;
attribute vec3 aVerNormal;
attribute vec2 aTexCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uAmbColor;
uniform vec3 uDirColor;
uniform vec3 uLightDir;

varying vec2 vTexCoord;
varying vec3 vLightWeight;

void main()
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVerPosition, 1.0);
    vTexCoord = aTexCoord;

    vec3 transformedNormal = uNMatrix * aVerNormal;
    float dirLightWeight = max(dot(transformedNormal, uLightDir), 0.0);
    vLightWeight = uAmbColor + uDirColor * dirLightWeight;
        
}
