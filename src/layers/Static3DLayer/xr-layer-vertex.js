export const vs = `#version 300 es
#define SHADER_NAME xr-layer-vertex-shader

in vec3 positions;


uniform vec3 volume_scale;


out vec3 vray_dir;
flat out vec3 transformed_eye;

void main() {
  vec3 volume_translation = vec3(0.0) - volume_scale * 0.5;
  gl_Position = project_common_position_to_clipspace(vec4(positions * volume_scale + volume_translation, 1.0));
  transformed_eye = (project_uCameraPosition - volume_translation) / volume_scale;
	vray_dir = positions - transformed_eye;
}`;
