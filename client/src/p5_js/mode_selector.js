class ModeSelector {
	constructor(p, client) {
		this.client = client;
		// assume that coordinate is to be set center
		// the position will be set to top-left
		this.positionModeSelectorX = 0;
		this.positionModeSelectorY = 0;
		this.modeSelectorMap = {};
		// division for mode-selector
		this.divisionModeSelector = p.createDiv();
		this.divisionModeSelector.position(
			this.positionModeSelectorX,
			this.positionModeSelectorY
		);
		this.divisionModeSelector.style("background", p.color(150, 50));
		this.divisionModeSelector.style("width", "100px");
		this.divisionModeSelector.style("text-align", "center");
		this.divisionModeSelector.style("display", "inline");
		this.divisionModeSelector.style("padding", "10px");
		// create button
		/**************************** list of mode-selector ****************************
        EmotionalShape:     
            The graphics which describes entire emotion of all user will be displayed.
        EmotionalBackground:
            There will be two graphics, one of which describes entire emotion of all and
            another describes each emotion of user.
        ********************************************************************************/
		this.modeSelectorMap.buttonEmotionalShape = p.createButton(
			"background"
		);
		this.modeSelectorMap.buttonEmotionalShape.mousePressed(
			this.visualizeEmotionalShape
		);
		this.modeSelectorMap.buttonEmotionalBackground = p.createButton(
			"shape"
		);
		this.modeSelectorMap.buttonEmotionalBackground.mousePressed(
			this.visualizeEmotionalBackground
		);
		this.addToDivision();
	}

	visualizeEmotionalShape() {
		this.client.is_emotional_shape_mode = !this.client
			.is_emotional_shape_mode;
	}
	visualizeEmotionalBackground() {
		this.client.is_emotional_background_mode = !this.client
			.is_emotional_background_mode;
	}

	addToDivision() {
		for (let key in this.modeSelectorMap) {
			this.modeSelectorMap[key].parent(this.divisionModeSelector);
			this.modeSelectorMap[key].style("width", "100px");
			this.modeSelectorMap[key].style("margin", "10px 0px 10px 0px");
		}
	}
}
