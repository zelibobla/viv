import { RENDERING_MODES as RENDERING_NAMES } from '../../constants';

export const RENDERING_MODES_BLEND = {
  [RENDERING_NAMES.MAX_INTENSITY_PROJECTION]: {
    _BEFORE_RENDER: `\
      float maxVal = -1.0;
    `,
    _RENDER: `\
    if(intensityValue > maxVal) {
      maxVal = intensityValue;
      renderDepthCoord = p;
    }
    `,
    _AFTER_RENDER: `\
      vec3 rgbCombo = vec3(0.0);
      vec3 hsvCombo = rgb2hsv(vec3(colorValues));
      hsvCombo = vec3(hsvCombo.xy, maxVal);
      rgbCombo += hsv2rgb(hsvCombo);
      color = vec4(rgbCombo, 1.0);
    `
  },
  [RENDERING_NAMES.MIN_INTENSITY_PROJECTION]: {
    _BEFORE_RENDER: `\
      float minVal = -1.0;
    `,
    _RENDER: `\
    if(intensityValue < minVal) {
      minVal = intensityValue;
      renderDepthCoord = p;
    }
    `,
    _AFTER_RENDER: `\
      vec3 rgbCombo = vec3(0.0);
      vec3 hsvCombo = rgb2hsv(vec3(colorValues));
      hsvCombo = vec3(hsvCombo.xy, minVal);
      rgbCombo += hsv2rgb(hsvCombo);
      color = vec4(rgbCombo, 1.0);
    `
  },
  [RENDERING_NAMES.ADDITIVE]: {
    _BEFORE_RENDER: ``,
    _RENDER: `\
      vec3 rgbCombo = vec3(0.0);
      vec3 hsvCombo = vec3(0.0);
      hsvCombo = rgb2hsv(vec3(colorValues));
      hsvCombo = vec3(hsvCombo.xy, intensityValue);
      rgbCombo += hsv2rgb(hsvCombo);
      // Do not go past 1 in opacity.
      intensityValue = min(intensityValue, 1.0);
      vec4 val_color = vec4(rgbCombo, intensityValue);
      // Opacity correction
      val_color.a = 1.0 - pow(1.0 - val_color.a, 1.0);
      color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
      color.a += (1.0 - color.a) * val_color.a;
      renderDepthCoord = p;
      if (color.a >= 0.95) {
        break;
      }
    `,
    _AFTER_RENDER: ``
  }
};

export const RENDERING_MODES_COLORMAP = {
  [RENDERING_NAMES.MAX_INTENSITY_PROJECTION]: {
    _BEFORE_RENDER: `\
      float maxVal = -1.0;
    `,
    _RENDER: `\
    if(intensityValue > maxVal) {
      maxVal = intensityValue;
      renderDepthCoord = p;
    }
    `,
    _AFTER_RENDER: `\
      // Do not go past 1 in opacity/colormap value.
      maxVal = min(maxVal, 1.0);
      color = colormap(maxVal, maxVal);
    `
  },
  [RENDERING_NAMES.MIN_INTENSITY_PROJECTION]: {
    _BEFORE_RENDER: `\
      float minVal = -1.0;
    `,
    _RENDER: `\
    if(intensityValue < minVal) {
      minVal = intensityValue;
      renderDepthCoord = p;
    }
    `,
    _AFTER_RENDER: `\
      // Do not go past 1 in opacity/colormap value.
      minVal = min(minVal, 1.0);
      color = colormap(minVal, minVal);
    `
  },
  [RENDERING_NAMES.ADDITIVE]: {
    _BEFORE_RENDER: ``,
    _RENDER: `\
		// Do not go past 1 in opacity/colormap value.
		intensityValue = min(intensityValue, 1.0);

		vec4 val_color = colormap(intensityValue, intensityValue);

		// Opacity correction
		val_color.a = 1.0 - pow(1.0 - val_color.a, 1.0);
		color.rgb += (1.0 - color.a) * val_color.a * val_color.rgb;
    color.a += (1.0 - color.a) * val_color.a;
    renderDepthCoord = p;
		if (color.a >= 0.95) {
			break;
		}
    p += ray_dir * dt;
    `,
    _AFTER_RENDER: ``
  }
};
