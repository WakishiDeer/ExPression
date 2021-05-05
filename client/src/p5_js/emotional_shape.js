/*  This class describes each shape of emotion.
    In order to make a group of these, instances made with this class
    contain not only their-owned properties but also shared one. */
class EmotionalShape extends Shape {
	constructor(emotionalShapeParameterMap, p) {
		super();
		// to make it simpler
		this.parameter = Shape.overallParameter;
		this.vertexNum = emotionalShapeParameterMap["vertexNum"];
		this.radiusMain = emotionalShapeParameterMap["radiusMain"];
		this.radiusMainTemp = emotionalShapeParameterMap["radiusMain"];
		this.radiusSub = (this.radiusMain * p.sin(p.PI / this.vertexNum)) / 2;
		this.radiusSubTemp = 0;
		this.length = this.radiusMain / 5;
		this.lengthTemp = this.length;
		this.lengthCoefficient = 0;
		this.thetaMain = 0.0;
		/*  Range will be..
        thetaMain: [10, 45]		*/
		this.thetaSub = 10.0;
		this.thetaSubTemp = 0;
		this.step = 360.0 / this.vertexNum;
		this.thetaBeat = 0.0;
		/*  Range will be..
        beatRate: [0.5, 1.5]	*/
		this.beatRate = 1.0;
	}

	/******************* when experiment or pilot-experiment mode is DISABLED *******************/

	draw(is_background = false) {
		// when drawing background, it won't draw filled shape but outline
		if (is_background) {
			p.noFill();
			p.stroke(
				this.hsb.hue,
				this.hsb.saturation,
				this.hsb.brightness,
				this.alpha
			);
			p.strokeWeight(10);
		} else {
			p.noStroke();
			p.fill(
				this.hsb.hue,
				this.hsb.saturation,
				this.hsb.brightness,
				this.alpha
			);
		}
		p.beginShape();
		// draw shape
		for (
			this.thetaMain = 0;
			Math.floor(this.thetaMain) <= 360;
			this.thetaMain += this.step
		) {
			// drawing process is below
			if (this.thetaMain == 0) {
				var outsidePointList = this.calcFirstOutsidePoint();
				var insidePointList = this.calcFirstInsidePoint();
			} else {
				outsidePointList = this.updatePoint(outsidePointList);
				insidePointList = this.updatePoint(insidePointList);
			}

			p.curveVertex(outsidePointList.xSubPrev, outsidePointList.ySubPrev);
			// p.curveVertex(outsidePointList.xSubCenter, outsidePointList.ySubCenter); // the center of arc
			p.curveVertex(outsidePointList.xSubNext, outsidePointList.ySubNext);

			p.curveVertex(insidePointList.xSubPrev, insidePointList.ySubPrev);
			// p.curveVertex(insidePointList.xSubCenter, insidePointList.ySubCenter);
			p.curveVertex(insidePointList.xSubNext, insidePointList.ySubNext);
		}
		p.endShape();
	}

	updateVA() {
		// Updating instance variables which can be normalized value (Valence and Arousal)
		this.normalizedValence =
			(this.parameter.average.valence - -1) / (1 - -1);
		this.normalizedArousal =
			(this.parameter.average.arousal - -1) / (1 - -1);
	}

	updateParameter() {
		/* Updates instance variables (related to valence and arousal) */
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
			(45 - 9);

		// color
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
		this.applyVa2Hsb();
		// other parameters
		this.step = 360.0 / this.vertexNum;
	}

	heartBeat() {
		this.thetaBeat +=
			(0.0288373 * this.normalizedValence +
				0.85448851 * this.normalizedArousal +
				0.00380819) *
			(10 - 0);
		this.beatRate =
			1 +
			p.sin(p.radians(this.thetaBeat)) *
				(0.08378954 * this.normalizedValence +
					0.66605913 * this.normalizedArousal +
					0.09988675);
		this.length = this.lengthTemp * this.beatRate;
		this.radiusMain = this.radiusMainTemp * this.beatRate;
	}

	/******************* when pilot-experiment mode is ENABLED *******************/

	drawPilotExperiment() {
		p.noStroke();
		p.fill(
			this.hsb.hue,
			this.hsb.saturation,
			this.hsb.brightness,
			this.alpha
		);
		p.beginShape();
		for (
			this.thetaMain = 0;
			Math.floor(this.thetaMain) <= 360;
			this.thetaMain += this.step
		) {
			// drawing process is below
			if (this.thetaMain == 0) {
				var outsidePointList = this.calcFirstOutsidePoint();
				var insidePointList = this.calcFirstInsidePoint();
			} else {
				outsidePointList = this.updatePoint(outsidePointList);
				insidePointList = this.updatePoint(insidePointList);
			}

			p.curveVertex(outsidePointList.xSubPrev, outsidePointList.ySubPrev);
			// p.curveVertex(outsidePointList.xSubCenter, outsidePointList.ySubCenter); // the center of arc
			p.curveVertex(outsidePointList.xSubNext, outsidePointList.ySubNext);

			p.curveVertex(insidePointList.xSubPrev, insidePointList.ySubPrev);
			// p.curveVertex(insidePointList.xSubCenter, insidePointList.ySubCenter);
			p.curveVertex(insidePointList.xSubNext, insidePointList.ySubNext);
		}
		p.endShape();
	}

	calcFirstOutsidePoint() {
		var xMain = this.radiusMain * p.cos(p.radians(this.thetaMain));
		var yMain = this.radiusMain * p.sin(p.radians(this.thetaMain));
		// derived from rotate matrix
		var xLength =
			this.length *
			p.cos(p.radians(this.thetaMain)) *
			this.lengthCoefficient;
		var radius = 10;
		var xSubPrev =
			xMain +
			xLength -
			radius * p.cos(p.radians(this.thetaMain - this.thetaSub));
		var ySubPrev =
			yMain +
			this.radiusSub * p.sin(p.radians(this.thetaMain - this.thetaSub));
		var xSubCenter =
			xMain + xLength + radius * p.cos(p.radians(this.thetaMain));
		var ySubCenter =
			yMain + this.radiusSub * p.sin(p.radians(this.thetaMain));
		var xSubNext =
			xMain +
			xLength -
			radius * p.cos(p.radians(this.thetaMain + this.thetaSub));
		var ySubNext =
			yMain +
			this.radiusSub * p.sin(p.radians(this.thetaMain + this.thetaSub));

		var outsidePointList = {
			xSubPrev: xSubPrev,
			ySubPrev: ySubPrev,
			xSubCenter: xSubCenter,
			ySubCenter: ySubCenter,
			xSubNext: xSubNext,
			ySubNext: ySubNext,
		};
		return outsidePointList;
	}

	calcFirstInsidePoint() {
		var xMain = this.radiusMain * p.cos(p.radians(this.thetaMain));
		var yMain = this.radiusMain * p.sin(p.radians(this.thetaMain));
		// derived from rotate matrix
		var xLength = this.lengthTemp * p.cos(p.radians(this.thetaMain));
		var radius = 10;
		var xSubPrev =
			xMain -
			xLength +
			radius * p.cos(p.radians(this.thetaMain - this.thetaSub));
		var ySubPrev =
			yMain +
			this.radiusSub * p.sin(p.radians(this.thetaMain - this.thetaSub));
		var xSubCenter =
			xMain - xLength - radius * p.cos(p.radians(this.thetaMain));
		var ySubCenter =
			yMain + this.radiusSub * p.sin(p.radians(this.thetaMain));
		var xSubNext =
			xMain -
			xLength +
			radius * p.cos(p.radians(this.thetaMain + this.thetaSub));
		var ySubNext =
			yMain +
			this.radiusSub * p.sin(p.radians(this.thetaMain + this.thetaSub));

		// rotate inside point for the initialization
		var stepHalf = this.step / 2;
		var xSubPrevTemp = xSubPrev,
			ySubPrevTemp = ySubPrev,
			xSubCenterTemp = xSubCenter,
			ySubCenterTemp = ySubCenter,
			xSubNextTemp = xSubNext,
			ySubNextTemp = ySubNext;

		xSubPrev =
			xSubPrevTemp * p.cos(p.radians(stepHalf)) -
			ySubPrevTemp * p.sin(p.radians(stepHalf));
		ySubPrev =
			xSubPrevTemp * p.sin(p.radians(stepHalf)) +
			ySubPrevTemp * p.cos(p.radians(stepHalf));

		xSubCenter =
			xSubCenterTemp * p.cos(p.radians(stepHalf)) -
			ySubCenterTemp * p.sin(p.radians(stepHalf));
		ySubCenter =
			xSubCenterTemp * p.sin(p.radians(stepHalf)) +
			ySubCenterTemp * p.cos(p.radians(stepHalf));

		xSubNext =
			xSubNextTemp * p.cos(p.radians(stepHalf)) -
			ySubNextTemp * p.sin(p.radians(stepHalf));
		ySubNext =
			xSubNextTemp * p.sin(p.radians(stepHalf)) +
			ySubNextTemp * p.cos(p.radians(stepHalf));

		var insidePointList = {
			xSubPrev: xSubPrev,
			ySubPrev: ySubPrev,
			xSubCenter: xSubCenter,
			ySubCenter: ySubCenter,
			xSubNext: xSubNext,
			ySubNext: ySubNext,
		};

		return insidePointList;
	}

	updatePoint(pl) {
		var xSubPrev = pl.xSubPrev,
			ySubPrev = pl.ySubPrev,
			xSubCenter = pl.xSubCenter,
			ySubCenter = pl.ySubCenter,
			xSubNext = pl.xSubNext,
			ySubNext = pl.ySubNext;

		pl.xSubPrev =
			xSubPrev * p.cos(p.radians(this.step)) -
			ySubPrev * p.sin(p.radians(this.step));
		pl.ySubPrev =
			xSubPrev * p.sin(p.radians(this.step)) +
			ySubPrev * p.cos(p.radians(this.step));

		pl.xSubCenter =
			xSubCenter * p.cos(p.radians(this.step)) -
			ySubCenter * p.sin(p.radians(this.step));
		pl.ySubCenter =
			xSubCenter * p.sin(p.radians(this.step)) +
			ySubCenter * p.cos(p.radians(this.step));

		pl.xSubNext =
			xSubNext * p.cos(p.radians(this.step)) -
			ySubNext * p.sin(p.radians(this.step));
		pl.ySubNext =
			xSubNext * p.sin(p.radians(this.step)) +
			ySubNext * p.cos(p.radians(this.step));
		return pl;
	}

	updateParameterPilotExperiment(controller, currentParameter) {
		// shape
		this.vertexNum = controller.controllerMap.sliderVertexNum.value();
		// this.radiusMainTemp = controller.controllerMap.sliderRadiusMain.value();
		this.heartBeatPilotExperiment(controller);
		this.lengthCoefficient = controller.controllerMap.sliderLengthCoefficient.value();
		this.radiusSub = (this.radiusMain * p.sin(p.PI / this.vertexNum)) / 2;
		this.thetaSub = controller.controllerMap.sliderThetaSub.value();
		// color
		if (controller.isHue) {
			this.hsb.hue = controller.controllerMap.sliderHue.value();
		} else {
			this.rgb.red = p.int((255 * (currentParameter.arousal + 1)) / 2);
			this.rgb.blue = 255 - this.rgb.red;
			this.rgb2Hsb();
		}
		this.applyVa2HsbPilotExperiment(currentParameter);
		this.step = 360.0 / this.vertexNum;
	}

	heartBeatPilotExperiment(controller) {
		this.thetaBeat += controller.controllerMap.sliderThetaBeat.value(); // for animation
		this.beatRate =
			1 +
			p.sin(p.radians(this.thetaBeat)) *
				controller.controllerMap.sliderAmplitude.value(); // for animation
		this.length = this.lengthTemp * this.beatRate;
		this.radiusMain = this.radiusMainTemp * this.beatRate;
	}

	/******************* when experiment mode is ENABLED *******************/

	updateVAExperiment(currentParameter) {
		this.normalizedValence = (currentParameter.valence - -1) / (1 - -1);
		this.normalizedArousal = (currentParameter.arousal - -1) / (1 - -1);
	}

	updateParameterExperiment(currentParameter) {
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
		// this.lengthCoefficient = this.normalizedArousal;
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
			(45 - 9);

		// color
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
		this.applyVa2HsbExperiment(currentParameter);
		// other parameters
		this.step = 360.0 / this.vertexNum;
	}
}
