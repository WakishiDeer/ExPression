class ControllerPilotExperiment {
	constructor(p) {
		// assume that coordinate is to be set center
		this.positionControllerX = p.width - 400;
		this.positionControllerY = 0;
		this.positionSelectorX = 0;
		this.positionSelectorY = 0;
		this.splitRate = 20;
		// param
		this.isHue = false;
		this.currentOrderRandomed = 0; // neutral face will be shown at first
		let tempParameter = {};
		// division for controller
		this.divisionController = p.createDiv();
		this.divisionController.style("width", "400px");
		this.divisionController.position(
			this.positionControllerX,
			this.positionControllerY
		);
		this.divisionController.style("background", p.color(150, 50));
		this.divisionController.style("text-align", "center");
		this.divisionController.style("display", "inline");
		this.divisionController.style("padding", "10px");
		// division for selector
		this.divisionSelector = p.createDiv();
		this.divisionSelector.style("width", "400px");
		this.divisionSelector.position(
			this.positionSelectorX,
			this.positionSelectorY
		);
		this.divisionSelector.style("background", p.color(150, 50));
		this.divisionSelector.style("text-align", "center");
		this.divisionSelector.style("display", "inline");
		this.divisionSelector.style("padding", "10px");
		// slider
		this.controllerMap = {};
		this.selectorMap = {};

		// thetaSub
		let defaultThetaSub = (45 + 9) / 2; // 27
		this.controllerMap.textThetaSub = p.createP(
			"形状: 尖形-円形（ThetaSub）"
		);
		this.controllerMap.sliderThetaSub = p.createSlider(
			9,
			45,
			defaultThetaSub,
			(45 - 9) / this.splitRate
		);

		// vertexNum
		let defaultVertexNum = 8;
		this.controllerMap.textVertexNum = p.createP(
			"頂点の数: 少ない-多い（VertexNum）"
		);
		this.controllerMap.sliderVertexNum = p.createSlider(
			8,
			28,
			defaultVertexNum,
			1
		);

		// lengthCoefficient
		let defaultLengthCoefficient = 1;
		this.controllerMap.textLengthCoefficient = p.createP(
			"盛り上がり具合: 小さい-大きい(defaultLengthCoefficient)"
		);
		this.controllerMap.sliderLengthCoefficient = p.createSlider(
			0,
			2,
			defaultLengthCoefficient,
			(2 - 0) / this.splitRate
		);

		// amplitude
		let defaultAmplitude = 1 / 2;
		this.controllerMap.textAmplitude = p.createP(
			"アニメーションの振幅: 小さい-大きい（Amplitude）"
		);
		this.controllerMap.sliderAmplitude = p.createSlider(
			0,
			1,
			defaultAmplitude,
			(1 - 0) / this.splitRate
		);

		// thetaBeat
		let defaultThetaBeat = 5;
		this.controllerMap.textThetaBeat = p.createP(
			"アニメーションの速度: 遅い-速い（ThetaBeat）"
		);
		this.controllerMap.sliderThetaBeat = p.createSlider(
			0,
			10,
			defaultThetaBeat,
			(10 - 0) / this.splitRate
		);

		// hue
		let defaultHue = 0;
		this.controllerMap.textHue = p.createP("色相（Hue）");
		this.controllerMap.sliderHue = p.createSlider(
			0,
			360,
			defaultHue,
			(360 - 0) / 36
		);

		// button for applying hue-mode
		const applyHueMode = () => {
			this.isHue = !this.isHue;
			if (!this.isHue) {
				for (let i = 0; i < 17; i++) {
					let currentParameter = Shape.overallParameter[String(i)];
					currentParameter.sliderHue = 0;
				}
			}
		};
		this.controllerMap.textHueMode = p.createP("HueMode");
		this.controllerMap.buttonHueMode = p
			.createButton("apply")
			.attribute("type", "button");
		this.controllerMap.buttonHueMode.mousePressed(applyHueMode);

		// button for applying fullscreen
		this.controllerMap.textFullscreen = p.createP("Fullscreen");
		this.controllerMap.buttonFullscreen = p
			.createButton("apply")
			.attribute("type", "button");
		this.controllerMap.buttonFullscreen.mousePressed(this.applyFullscreen);

		/* ************************************************************* */

		this.selectorMap.radioSwitch = p.createRadio();
		for (let i = 0; i < Shape.overallParameter.randomedOrder.length; i++) {
			this.selectorMap.radioSwitch.option(
				String(Shape.overallParameter.randomedOrder[i]),
				Shape.overallParameter.randomedOrder[i]
			);
			console.log(i + ": " + Shape.overallParameter.randomedOrder[i]);
		}

		const getSwitchValue = () => {
			// get value and parameterMap of selected radio button
			this.currentOrderRandomed = this.selectorMap.radioSwitch.value();
			let currentParameter =
				Shape.overallParameter[String(this.currentOrderRandomed)];
			// copy parameter to tempParameter (which will be used when saving)
			tempParameter = JSON.stringify(Shape.overallParameter);
			tempParameter = JSON.parse(tempParameter);
			console.log(JSON.stringify(tempParameter, null, 2));
			p.clearStorage();
			p.storeItem("temporary", JSON.stringify(tempParameter));
			// set sliders to default
			this.controllerMap.sliderThetaSub.value(
				String(currentParameter.sliderThetaSub)
			);
			this.controllerMap.sliderVertexNum.value(
				String(currentParameter.sliderVertexNum)
			);
			this.controllerMap.sliderLengthCoefficient.value(
				String(currentParameter.sliderLengthCoefficient)
			);
			this.controllerMap.sliderAmplitude.value(
				String(currentParameter.sliderAmplitude)
			);
			this.controllerMap.sliderThetaBeat.value(
				String(currentParameter.sliderThetaBeat)
			);
			if (this.isHue) {
				this.controllerMap.sliderHue.value(
					String(currentParameter.sliderHue)
				);
			}
			// get element to set each valence and arousal of image
			let htmlValence = document.getElementById("AS-pleasure"); // operate affective-slider
			let htmlArousal = document.getElementById("AS-arousal"); // operate affective-slider
			// operate affective-slider
			htmlValence.value =
				Shape.overallParameter[
					String(this.currentOrderRandomed)
				].valence;
			htmlArousal.value =
				Shape.overallParameter[
					String(this.currentOrderRandomed)
				].arousal;
			// show image
			let img = document.getElementById("affectnet_images");
			img.src = "images/" + String(this.currentOrderRandomed) + ".jpg";
			console.log("Current Order Randomed: " + this.currentOrderRandomed);
			console.log(
				"valence: " +
					Shape.overallParameter[String(this.currentOrderRandomed)]
						.valence
			);
			console.log(
				"arousal: " +
					Shape.overallParameter[String(this.currentOrderRandomed)]
						.arousal
			);
			console.log("\n");
		};
		this.selectorMap.radioSwitch.changed(getSwitchValue);

		// the value of input will be used when writing or saving parameter as .json
		this.selectorMap.inputName = p
			.createInput("")
			.attribute("placeholder", "Put your name");

		// show parameter
		const showParameter = () => {
			console.log(
				JSON.stringify(
					Shape.overallParameter[String(this.currentOrderRandomed)],
					null,
					2
				)
			);
		};
		this.selectorMap.buttonShowParameter = p
			.createButton("Show Parameter")
			.attribute("type", "button");
		this.selectorMap.buttonShowParameter.mousePressed(showParameter);

		// write parameter from stored value
		const writeParameter = () => {
			if (this.selectorMap.inputName.value() == "") {
				return; // when name is unfilled, do nothing
			}
			tempParameter = JSON.stringify(Shape.overallParameter);
			tempParameter = JSON.parse(tempParameter);
			console.log(JSON.stringify(tempParameter, null, 2));
			p.saveJSON(
				tempParameter,
				this.selectorMap.inputName.value() + ".json"
			);
			console.log(
				"Write parameter as: " + this.selectorMap.inputName.value()
			);
		};
		this.selectorMap.buttonWriteParameter = p
			.createButton("Write Parameter")
			.attribute("type", "button");
		this.selectorMap.buttonWriteParameter.mousePressed(writeParameter);

		// read parameter from saved file
		const readParameter = () => {
			// copy parameter to tempParameter (which will be used when saving)
			let s = p.getItem("temporary");
			Shape.overallParameter = JSON.parse(s);
			console.log(Shape.overallParameter);

			// update values of slider
			this.currentOrderRandomed = this.selectorMap.radioSwitch.value();
			if (this.currentOrderRandomed === "") {
				this.currentOrderRandomed = 0;
			}
			let currentParameter =
				Shape.overallParameter[String(this.currentOrderRandomed)];
			console.log("current");
			console.log(this.currentOrderRandomed);
			this.controllerMap.sliderThetaSub.value(
				String(currentParameter.sliderThetaSub)
			);
			this.controllerMap.sliderVertexNum.value(
				String(currentParameter.sliderVertexNum)
			);
			this.controllerMap.sliderLengthCoefficient.value(
				String(currentParameter.sliderLengthCoefficient)
			);
			this.controllerMap.sliderAmplitude.value(
				String(currentParameter.sliderAmplitude)
			);
			this.controllerMap.sliderThetaBeat.value(
				String(currentParameter.sliderThetaBeat)
			);
			if (this.isHue) {
				this.controllerMap.sliderHue.value(
					String(currentParameter.sliderHue)
				);
			}
		};
		this.selectorMap.buttonReadParameter = p
			.createButton("Read Parameter")
			.attribute("type", "button");
		this.selectorMap.buttonReadParameter.mousePressed(readParameter);

		/************************************************************** */

		this.addToDivision();
	}

	applyFullscreen() {
		// return current state is fullscreen or not
		let fs = p.fullscreen();
		p.fullscreen(!fs);
	}

	addToDivision() {
		for (let key in this.controllerMap) {
			this.controllerMap[key].parent(this.divisionController);
			this.controllerMap[key].style("width", "350px");
			this.controllerMap[key].style("margin", "10px 0px 10px 0px");
		}
		for (let key in this.selectorMap) {
			this.selectorMap[key].parent(this.divisionSelector);
			this.selectorMap[key].style("width", "350px");
			this.selectorMap[key].style("margin", "10px 0px 10px 0px");
		}
	}

	setPosition() {
		this.positionControllerX = p.width - 400;
		this.divisionController.position(
			this.positionControllerX,
			this.positionControllerY
		);
	}
}
