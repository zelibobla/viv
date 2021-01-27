#version 300 es
#define SHADER_NAME xr-layer-vertex-shader

in vec3 positions;
uniform vec3 dimensions;

out vec3 vray_dir;
flat out vec3 transformed_eye;

void main() {
  // This puts the center at the midpoint of the dimensions.
  vec3 coords = project_position(positions * dimensions);
  gl_Position = project_common_position_to_clipspace(vec4(coords, 1.0));
  // Camera position from deck.gl is has the origin subtracted off from it.
  transformed_eye = (project_uCameraPosition + project_uCoordinateOrigin) / dimensions;
	vray_dir = positions - transformed_eye;
}
