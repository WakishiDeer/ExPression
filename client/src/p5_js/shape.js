class Shape {
	/* NOTE:    if "--is_experiment" is True,
                contents of overallParameter should be different.
                you can refer to "proxy.py" which is server's program. */
	overallParameter = {}; // in order to access this from any shape
	constructor() {
		this.a = { xn: 109.854, yn: 100.0, zn: 108.88 };
		this.d50 = {};
		this.d65 = { xn: 95.039, yn: 100.0, zn: 108.88 };
		this.whitePoint = { a: this.a, d50: this.d50, d65: this.d65 };
		this.alpha = 1.0;
		/*  Range will be..
            red:    [0, 255]
            green:  [0, 255]
            blue:   [0, 255]
        */
		this.rgb = { red: 0, green: 0, blue: 0 };
		/* Range will be..
            l:  [0, 100]
            a:  [-128, 127)
            b:  [-128, 127)
        */
		this.hsb = { hue: 0, saturation: 0, brightness: 0 };
		/* Range will be..
            hue:    [0, 360)
            sat:    [0, 100]
            bri:    [0, 100]
        */
		this.lab = { l: 0, a: 0, b: 0, delta: 6 / 29 };
		/*  For the name of 'va', 'v' means "valence" which is usually described
            as positive-negative emotion, while 'a' means "arousal" which express
            high or low value of emotion.
            For more details, please refer to: https://psycnet.apa.org/record/1981-25062-001
        */
		this.xyz = { x: 0, y: 0, z: 0 };
		/* Range will be..
            v:  [-1, 1]
            a:  [-1, 1]
            (and should be fulfilled with.. r = pow(v**2 + a**2, 1/2) < 1)
         */
		/* Range will be..
		normalizedValence:	[0.0, 1.0]
		normalizedArousal:	[0.0, 1.0]	*/
		this.normalizedValence = 0.0;
		this.normalizedArousal = 0.0;
		/* The regression equations studied by P. Valdez and A. Mehrabian are following:
            (1) Pleasure = 0.69 Brightness + 0.22 Saturation
            (2) Arousal = -0.31 Brightness + 0.60 Saturation
            (3) Dominance = -0.76 Brightness + 0.32 Saturation
        For more details, please refer to: https://psycnet.apa.org/buy/1995-08699-001
        */
		/* For normalization of brightness and saturation. */
		this.minBrightness = -0.69 - 0.31;
		this.maxBrightness = 0.69 + 0.31;
		this.minSaturation = -0.22 - 0.6;
		this.maxSaturation = 0.22 + 0.6;
	}

	/* Color setter and getter */
	setColor() {
		this.rgb = hsb2Rgb();
	}

	getColor() {
		return this.rgb;
	}

	/* Relation between Color and (Valence, Arousal)'s calculation */
	applyVa2Hsb() {
		this.hsb.brightness =
			((Shape.overallParameter.average.valence * 0.69 +
				Shape.overallParameter.average.arousal * -0.31 -
				this.minBrightness) /
				(this.maxBrightness - this.minBrightness)) *
			100;
		this.hsb.saturation =
			((Shape.overallParameter.average.valence * 0.22 +
				Shape.overallParameter.average.arousal * 0.6 -
				this.minSaturation) /
				(this.maxSaturation - this.minSaturation)) *
			100;
	}

	applyVa2HsbBackground() {
		this.hsb.brightness =
			((this.normalizedValence * 0.69 +
				this.normalizedArousal * -0.31 -
				this.minBrightness) /
				(this.maxBrightness - this.minBrightness)) *
			100;
		this.hsb.saturation =
			((this.normalizedValence * 0.22 +
				this.normalizedArousal * 0.6 -
				this.minSaturation) /
				(this.maxSaturation - this.minSaturation)) *
			100;
	}

	applyVa2HsbPilotExperiment(currentParameter) {
		this.hsb.brightness =
			((currentParameter.valence * 0.69 +
				currentParameter.arousal * -0.31 -
				this.minBrightness) /
				(this.maxBrightness - this.minBrightness)) *
			100;
		this.hsb.saturation =
			((currentParameter.valence * 0.22 +
				currentParameter.arousal * 0.6 -
				this.minSaturation) /
				(this.maxSaturation - this.minSaturation)) *
			100;
	}

	applyVa2HsbExperiment(currentParameter) {
		this.hsb.brightness =
			((currentParameter.valence * 0.69 +
				currentParameter.arousal * -0.31 -
				this.minBrightness) /
				(this.maxBrightness - this.minBrightness)) *
			100;
		this.hsb.saturation =
			((currentParameter.valence * 0.22 +
				currentParameter.arousal * 0.6 -
				this.minSaturation) /
				(this.maxSaturation - this.minSaturation)) *
			100;
	}

	/* Color conversion */
	rgb2Hsb() {
		let rgbClone = Object.create(this.rgb);
		for (let key in rgbClone) {
			rgbClone[key] /= 255;
		}
		let max = 0,
			min = 0;
		max = Math.max(rgbClone.red, rgbClone.green, rgbClone.blue);
		min = Math.min(rgbClone.red, rgbClone.green, rgbClone.blue);
		if (max == min) {
			return;
		} else if (min == rgbClone.blue) {
			this.hsb.hue =
				60 * ((rgbClone.green - rgbClone.red) / (max - min)) + 60;
		} else if (min == rgbClone.red) {
			this.hsb.hue =
				60 * ((rgbClone.blue - rgbClone.green) / (max - min)) + 180;
		} else if (min == rgbClone.green) {
			this.hsb.hue =
				60 * ((rgbClone.red - rgbClone.blue) / (max - min)) + 300;
		}
		this.hsb.saturation = max - min; // for cone model
		this.hsb.brightness = max;
	}

	hsb2Rgb() {}

	lab2Xyz() {
		var fy = (this.lab.l + 16) / 116;
		var fx = fy + this.lab.a / 500;
		var fz = fy - this.lab.b / 200;
		Y =
			fy > this.lab.delta
				? this.whitePoint.d65.yn * fy ** 3
				: (fy - 16 / 116) *
				  3 *
				  this.lab.delta ** 2 *
				  this.whitePoint.yn;
		X =
			fx > this.lab.delta
				? this.whitePoint.d65.xn * fx ** 3
				: (fx - 16 / 116) *
				  3 *
				  this.lab.delta ** 2 *
				  this.whitePoint.xn;
		Z =
			fz > this.lab.delta
				? this.whitePoint.d65.yn * fz ** 3
				: (fz - 16 / 116) *
				  3 *
				  this.lab.delta ** 2 *
				  this.whitePoint.zn;
		this.xyz.x = X;
		this.xyz.y = Y;
		this.xyz.z = Z;
	}

	xyz2Rgb() {}
}
