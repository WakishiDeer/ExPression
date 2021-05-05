class ControllerExperiment {
	constructor(p) {
		// assume that coordinate is to be set center
		this.positionControllerX = p.width - 400;
		this.positionControllerY = 0;
		this.positionSelectorX = 0;
		this.positionSelectorY = 0;
		// param
		this.selectorMap = {};
		this.currentValence = 0;
		this.currentArousal = 0;
		this.currentOrder = 0;
		this.htmlValence = document.getElementById("AS-pleasure"); // affective-slider
		this.htmlArousal = document.getElementById("AS-arousal"); // affective-slider
		this.parameterMap = {};
		let tempParameter = {};
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
		// initialization
		let N = 17;
		for (let i = 0; i < N; i++) {
			this.parameterMap[String(i)] = {
				valence: 0.0,
				arousal: 0.0,
			};
		}

		// create radio button
		this.selectorMap.radioSwitch = p.createRadio();
		for (let i = 0; i < Shape.overallParameter.order.length; i++) {
			this.selectorMap.radioSwitch.option(String(i), i);
		}
		const getSwitchValue = () => {
			// get value and parameterMap of selected radio button
			this.currentOrder = this.selectorMap.radioSwitch.value();
			let currentParameter =
				Shape.overallParameter[String(this.currentOrder)];
			// copy parameter to tempParameter (which will be used when saving)
			tempParameter = JSON.stringify(Shape.overallParameter);
			tempParameter = JSON.parse(tempParameter);
			console.log(JSON.stringify(tempParameter, null, 2));
			p.clearStorage();
			p.storeItem("temporary", JSON.stringify(tempParameter));
			// set sliders to stored values
			this.htmlValence.value = currentParameter.userValence;
			this.htmlArousal.value = currentParameter.userArousal;
			// set values
			this.currentValence = this.htmlValence.value;
			this.currentArousal = this.htmlArousal.value;
			// store values to parameterMap
			this.parameterMap[
				String(this.currentOrder)
			].valence = this.currentValence;
			this.parameterMap[
				String(this.currentOrder)
			].arousal = this.currentArousal;
			// initialize values
			this.htmlValence.value = currentParameter.userValence;
			this.htmlArousal.value = currentParameter.userArousal;
			console.log("currentValence: " + this.currentValence);
			console.log("currentArousal: " + this.currentArousal);
		};
		this.selectorMap.radioSwitch.changed(getSwitchValue);

		// read parameter from saved file
		const readParameter = () => {
			// copy parameter to tempParameter (which will be used when saving)
			let s = p.getItem("temporary");
			Shape.overallParameter = JSON.parse(s);
			console.log(Shape.overallParameter);

			// update values of slider
			this.currentOrder = this.selectorMap.radioSwitch.value();
			if (this.currentOrder === "") {
				this.currentOrder = 0;
			}
			let currentParameter =
				Shape.overallParameter[String(this.currentOrder)];
			this.htmlValence.value = currentParameter.userValence;
			this.htmlArousal.value = currentParameter.userArousal;
		};
		this.selectorMap.buttonReadParameter = p
			.createButton("Read Parameter")
			.attribute("type", "button");
		this.selectorMap.buttonReadParameter.mousePressed(readParameter);

		// the value of input will be used when writing or saving parameter as .json
		this.selectorMap.inputName = p
			.createInput("")
			.attribute("placeholder", "Put your name");
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

		// show parameter
		const showParameter = () => {
			console.log(
				JSON.stringify(
					Shape.overallParameter[String(this.currentOrder)],
					null,
					2
				)
			);
		};
		this.selectorMap.buttonShowParameter = p
			.createButton("Show Parameter")
			.attribute("type", "button");
		this.selectorMap.buttonShowParameter.mousePressed(showParameter);

		// button for applying fullscreen
		this.selectorMap.buttonFullscreen = p
			.createButton("Fullscreen")
			.attribute("type", "button");
		this.selectorMap.buttonFullscreen.mousePressed(this.applyFullscreen);

		this.addToDivision();
	}

	applyFullscreen() {
		// return current state is fullscreen or not
		let fs = p.fullscreen();
		p.fullscreen(!fs);
	}

	addToDivision() {
		for (let key in this.selectorMap) {
			this.selectorMap[key].parent(this.divisionSelector);
			this.selectorMap[key].style("width", "350px");
			this.selectorMap[key].style("margin", "10px 0px 10px 0px");
		}
	}
}
