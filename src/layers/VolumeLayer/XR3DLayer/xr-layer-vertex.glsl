#version 300 es
#define SHADER_NAME xr-layer-vertex-shader

// Unit-cube vertices
in vec3 positions;

// Eye position - last column of the inverted view matrix
uniform vec3 eye_pos;
// Projection matrix
uniform mat4 proj;
// Model Matrix
uniform mat4 model;
// View Matrix
uniform mat4 view;
// A matrix for scaling in the model space before any transformations.
// This projects the unit cube up to match the "pixel size" multiplied by the physical size ratio, if provided.
uniform mat4 scale;


out vec3 vray_dir;
flat out vec3 transformed_eye;

void main() {
  // Standard MVP transformation (+ the scale matrix) to put the positions on the screen.
  gl_Position = proj * view * model * scale * vec4(positions, 1.0);
  // Invert the eye back to normalized 0-1 cube view space (i.e un-transform and un-scale the coordinates).
  transformed_eye = (inverse(scale) * inverse(model) * (vec4(eye_pos, 1.0))).xyz;
  // Rays are from eye to vertices so that they get interpolated over the fragments.
	vray_dir = positions - transformed_eye;
  vec3 mult = project_uCoordinateOrigin.xyz + project_uCenter.xyz;
}
