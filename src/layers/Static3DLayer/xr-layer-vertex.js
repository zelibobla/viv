export const vs = `#version 300 es
#define SHADER_NAME xr-layer-vertex-shader

in vec3 positions;
uniform vec3 dimensions;

out vec3 vray_dir;
flat out vec3 transformed_eye;

void main() {
  vec3 coords = project_position(positions * dimensions + (vec3(0.0) - dimensions * 0.5));
  vec3 volume_translation = project_position(vec3(0.0) - dimensions * 0.5);
  vec3 volume_scale = project_size(dimensions);
  gl_Position = project_common_position_to_clipspace(vec4(coords, 1.0));
  transformed_eye = (project_uCameraPosition - volume_translation) / volume_scale;
	vray_dir = positions - transformed_eye;
}`;
