#version 300 es
precision highp int;
precision highp float;
precision highp sampler3D;

uniform highp sampler3D volume0;
uniform highp sampler3D volume1;
uniform highp sampler3D volume2;
uniform highp sampler3D volume3;
uniform highp sampler3D volume4;
uniform highp sampler3D volume5;

uniform vec3 dimensions;

// range
uniform vec2 sliderValues[6];

// color
uniform vec3 colorValues[6];

// slices
uniform vec2 xSlice;
uniform vec2 ySlice;
uniform vec2 zSlice;

in vec3 vray_dir;
flat in vec3 transformed_eye;
out vec4 color;

vec2 intersect_box(vec3 orig, vec3 dir) {
	const vec3 box_min = vec3(0);
	const vec3 box_max = vec3(1);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (box_min - orig) * inv_dir;
	vec3 tmax_tmp = (box_max - orig) * inv_dir;
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
  float t1 = min(tmax.x, min(tmax.y, tmax.z));
  vec2 val = vec2(t0, t1);
	return val;
}

float wang_hash(int seed) {
	seed = (seed ^ 61) ^ (seed >> 16);
	seed *= 9;
	seed = seed ^ (seed >> 4);
	seed *= 0x27d4eb2d;
	seed = seed ^ (seed >> 15);
	return float(seed % 2147483647) / float(2147483647);
}

float linear_to_srgb(float x) {
	if (x <= 0.0031308f) {
		return 12.92f * x;
	}
	return 1.055f * pow(x, 1.f / 2.4f) - 0.055f;
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 rgb) {
 	float Cmax = max(rgb.r, max(rgb.g, rgb.b));
 	float Cmin = min(rgb.r, min(rgb.g, rgb.b));
 	float delta = Cmax - Cmin;

 	vec3 hsv = vec3(0., 0., Cmax);

 	if (Cmax > Cmin) {
 		hsv.y = delta / Cmax;

 		if (rgb.r == Cmax) {
      hsv.x = (rgb.g - rgb.b) / delta;
    }
 		else {
 			if (rgb.g == Cmax){
        hsv.x = 2. + (rgb.b - rgb.r) / delta;
      }
 			else {
        hsv.x = 4. + (rgb.r - rgb.g) / delta;
      }
 		}
 		hsv.x = fract(hsv.x / 6.);
 	}
 	return hsv;
 }


void main(void) {
  vec3 ray_dir = normalize(vray_dir);
  vec2 t_hit = intersect_box(transformed_eye, ray_dir);
  if (t_hit.x > t_hit.y) {
    discard;
  }
  t_hit.x = max(t_hit.x, 0.0);
  vec3 dt_vec = 1.0 / (vec3(dimensions) * abs(ray_dir));
	float extraDt = 1.1;
  float dt = extraDt * min(dt_vec.x, min(dt_vec.y, dt_vec.z));
	float offset = wang_hash(int(gl_FragCoord.x + 640.0 * gl_FragCoord.y));
	vec3 p = transformed_eye + (t_hit.x + offset * dt) * ray_dir;
	// TODO: Probably want to stop this process at some point to improve performance when marching down the edges.
	for (float t = t_hit.x; t < t_hit.y; t += dt) {
		float canShowXCoordinate = max(p.x - xSlice[0], 0.0) * max(xSlice[1] - p.x , 0.0);
		float canShowYCoordinate = max(p.y - ySlice[0], 0.0) * max(ySlice[1] - p.y , 0.0);
		float canShowZCoordinate = max(p.z - zSlice[0], 0.0) * max(zSlice[1] - p.z , 0.0);
		float canShowCoordinate = float(ceil(canShowXCoordinate * canShowYCoordinate * canShowZCoordinate));
    float intensityValue0 = canShowCoordinate * max((float(texture(volume0, p).r) - sliderValues[0][0]) / sliderValues[0][1], 0.0);
    float intensityValue1 = canShowCoordinate * max((float(texture(volume1, p).r) - sliderValues[1][0]) / sliderValues[1][1], 0.0);
		float intensityValue2 = canShowCoordinate * max((float(texture(volume2, p).r) - sliderValues[2][0]) / sliderValues[2][1], 0.0);
		float intensityValue3 = canShowCoordinate * max((float(texture(volume3, p).r) - sliderValues[3][0]) / sliderValues[3][1], 0.0);
    float intensityValue4 = canShowCoordinate * max((float(texture(volume4, p).r) - sliderValues[4][0]) / sliderValues[4][1], 0.0);
		float intensityValue5 = canShowCoordinate * max((float(texture(volume5, p).r) - sliderValues[5][0]) / sliderValues[5][1], 0.0);

		float intensityArray[6] = float[6](intensityValue0, intensityValue1, intensityValue2, intensityValue3, intensityValue4, intensityValue5);
		float total = 0.0;

		for(int i = 0; i < 6; i++) {
			total += intensityArray[i];
		}
		// Do not go past 1 in opacity/colormap value.
		total = min(total, 1.0);

		vec4 val_color = colormap(total, total);

		// Opacity correction
		val_color.a = 1.0 - pow(1.0 - val_color.a, 1.0);
		color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
		color.a += (1.0 - color.a) * val_color.a;
		if (color.a >= 0.95) {
			break;
		}
		p += ray_dir * dt;
	}
  color.r = linear_to_srgb(color.r);
  color.g = linear_to_srgb(color.g);
  color.b = linear_to_srgb(color.b);
}
