#version 300 es
#define SHADER_NAME xr-layer-vertex-shader

in vec3 positions;
uniform vec3 dimensions;

out vec3 vray_dir;
flat out vec3 transformed_eye;

void main() {
  // This puts the center at the midpoint of the dimensions.
  vec3 dimension_translation = vec3(dimensions / 2.0) - dimensions * 0.5;
  vec3 coords = project_position(positions * dimensions + dimension_translation);
  vec3 volume_translation = project_position(dimension_translation);
  vec3 volume_scale = project_size(dimensions);
  gl_Position = project_common_position_to_clipspace(vec4(coords, 1.0));
  transformed_eye = (project_uCameraPosition - volume_translation) / volume_scale;
	vray_dir = positions - transformed_eye;
}
