class EmotionalBackground extends EmotionalShape {
	constructor(emotionalBackgroundParameterMap, user, client_number, p) {
		super(emotionalBackgroundParameterMap, p);
		/* NOTE: variables written in above will be inherited
		Range will be..
		normalizedValence:	[0.0, 1.0]
		normalizedArousal:	[0.0, 1.0]
		NOTE: variables written in above will be inherited
		*/
		// user's parameter (map)
		this.name = user;
		this.userParameter = emotionalBackgroundParameterMap[this.name];
		this.alpha = 0.5;
		this.space = 50;
		this.client_number = client_number;
		this.radiusMain =
			emotionalBackgroundParameterMap.radiusMain +
			this.space * this.client_number;
		this.radiusMainTemp = this.radiusMain;
		this.coefficientTanh = 0.1;
	}

	/* Override */
	updateParameter() {
		// Updating instance variables which can be normalized value (Valence and Arousal)
		this.normalizedValence = (this.userParameter.valence - -1) / (1 - -1);
		this.normalizedArousal = (this.userParameter.arousal - -1) / (1 - -1);
		// shape
		this.vertexNum = p.int(
			(-0.36866938 * this.normalizedValence +
				0.31354959 * this.normalizedArousal +
				0.37694756) *
				(28 - 8)
		);
		if (this.vertexNum < 8) {
			this.vertexNum = 8;
		}
		this.heartBeat();
		this.lengthCoefficient =
			(-0.27990727 * this.normalizedValence +
				0.39119481 * this.normalizedArousal +
				0.46152919) *
			(2 - 0);
		this.radiusSub = (this.radiusMain * p.sin(p.PI / this.vertexNum)) / 2;
		this.thetaSub =
			(0.65775664 * this.normalizedValence +
				-0.04035559 * this.normalizedArousal +
				0.19485669) *
			(45 - 9); // color
		this.rgb.red = p.int(255 * this.normalizedArousal);
		this.rgb.green =
			255 -
			p.int(
				255 * p.abs(this.normalizedArousal * 2 - 1) +
					255 * p.abs(this.normalizedValence * 2 - 1)
			) /
				2;
		this.rgb.blue = 255 - this.rgb.red;
		this.rgb2Hsb();
		this.applyVa2HsbBackground();
		// other parameters
		this.step = 360.0 / this.vertexNum;
	}

	/* Override */
	heartBeat() {
		this.thetaBeat +=
			(0.0288373 * this.normalizedValence +
				0.85448851 * this.normalizedArousal +
				0.00380819) *
			(10 - 0);
		this.beatRate =
			1 +
			(p.sin(p.radians(this.thetaBeat)) *
				(0.08378954 * this.normalizedValence +
					0.66605913 * this.normalizedArousal +
					0.09988675)) /
				8;
		this.length = this.lengthTemp * this.beatRate;
		this.radiusMain = this.radiusMainTemp * this.beatRate;
	}
}
