#version 300 es
#define SHADER_NAME xr-layer-vertex-shader

in vec3 positions;
uniform vec3 dimensions;
uniform vec3 eye_pos;
uniform mat4 proj;
uniform mat4 model;
uniform mat4 view;

out vec3 vray_dir;
flat out vec3 transformed_eye;

void main() {
  // This puts the center at the midpoint of the dimensions.
  vec3 coords = (positions);
  gl_Position = proj * view * model * (vec4(coords, 1.0));
  // Camera position from deck.gl is has the origin subtracted off from it.
  transformed_eye = (inverse(model) * (vec4(eye_pos, 1.0))).xyz;
	vray_dir = positions - transformed_eye;
}
