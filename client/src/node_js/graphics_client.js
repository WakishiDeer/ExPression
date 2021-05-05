// WebSocket (Connects to node"s program)
const sock = new WebSocket("ws://localhost:8000");
let receivedCount = 0;
let isRunning = false;

// Event listeners
sock.addEventListener("open", (e) => {
	console.log("Client Started..");
});
sock.addEventListener("message", (e) => {
	if (e.data == undefined) {
		return;
	}
	if (receivedCount == 0) {
		Shape.overallParameter = JSON.parse(e.data);
		isRunning = true;
		// instantiate a client
		client = new Client();
	}

	// if experimental mode is DISABLED, update parameter for each frame
	if (
		!Shape.overallParameter.is_pilot_experiment &&
		!Shape.overallParameter.is_experiment
	) {
		Shape.overallParameter = JSON.parse(e.data);
	}
	receivedCount++;
});
sock.addEventListener("close", (e) => {
	window.open("", "_self").close();
});
sock.addEventListener("error", (e) => {});

/* ****************************************************************** */

let p;
const sketch = function (p5) {
	p = p5;
	p.setup = function () {
		p.createCanvas(p.windowWidth, p.windowHeight);
		p.pixelDensity(2);
		p.background(200);
		p.textSize(20);
		p.textFont("Courier");
		p.smooth();
	};

	p.draw = function () {
		if (!isRunning) {
			return;
		}
		p.colorMode(p.HSB);
		// background
		p.noStroke();
		p.fill(200);
		p.rect(0, 0, p.width, p.height);
		if (Shape.overallParameter.is_pilot_experiment) {
			// emotional shape
			client.handleShape();
			// save or update user-set parameter
			client.handleUpdateParameterJSONPilotExperiment();
		} else if (Shape.overallParameter.is_experiment) {
			// emotional shape
			client.handleShape();
			// save or update user-set parameter
			client.handleUpdateParameterJSONExperiment();
		} else if (Shape.overallParameter.is_screen) {
			// client.determineMode();
			client.handleBackground();
			client.handleShape();
			client.handleText();
		}
	};

	p.windowResized = function () {
		console.log("resized: (" + p.windowWidth + ", " + p.windowHeight + ")");
		p.resizeCanvas(p.windowWidth, p.windowHeight);
		// if pilot-experiment mode is ENABLED, set position of controller
		if (
			Shape.overallParameter.is_pilot_experiment &&
			typeof client !== "undefined" &&
			client != null
		) {
			client.controllerPilotExperiment.setPosition();
		}
	};
};

class Client {
	constructor() {
		this.is_emotional_background_mode = true;
		this.is_emotional_shape_mode = true;

		this.emotionalShapeParameterMap = {
			vertexNum: 8,
			radiusMain: 100,
		};
		this.emotionalBackgroundParameterMap = {
			vertexNum: 8,
			radiusMain: 200,
		};
		this.es = new EmotionalShape(this.emotionalShapeParameterMap, p);
		this.ebMap = {};

		// if pilot- or main- experiment mode is ENABLED
		if (Shape.overallParameter.is_pilot_experiment) {
			this.controllerPilotExperiment = new ControllerPilotExperiment(p);
			// initialize Shape.overallParameter
			for (let i = 0; i < 17; i++) {
				let currentParameter = Shape.overallParameter[String(i)];
				currentParameter.sliderThetaSub = this.controllerPilotExperiment.controllerMap.sliderThetaSub.value();
				currentParameter.sliderVertexNum = this.controllerPilotExperiment.controllerMap.sliderVertexNum.value();
				currentParameter.sliderLengthCoefficient = this.controllerPilotExperiment.controllerMap.sliderLengthCoefficient.value();
				currentParameter.sliderAmplitude = this.controllerPilotExperiment.controllerMap.sliderAmplitude.value();
				currentParameter.sliderThetaBeat = this.controllerPilotExperiment.controllerMap.sliderThetaBeat.value();
				currentParameter.sliderHue = this.controllerPilotExperiment.controllerMap.sliderHue.value();
			}
		} else if (Shape.overallParameter.is_experiment) {
			this.controllerExperiment = new ControllerExperiment(p);
			for (let i = 0; i < 17; i++) {
				let currentParameter = Shape.overallParameter[String(i)];
				currentParameter.userValence = 0.0;
				currentParameter.userArousal = 0.0;
			}
		} else {
			// this.modeSelector = new ModeSelector(p, this);
		}
	}

	determineMode() {
		// each shape as background (emotional background)
		if (this.is_emotional_background_mode) {
			client.handleBackground();
		}
		// emotional shape
		if (this.is_emotional_shape_mode) {
			client.handleShape();
		}
		// guide text
		client.handleText();
	}

	handleShape() {
		p.push();
		p.translate(p.width / 2, p.height / 2);
		if (Shape.overallParameter.is_pilot_experiment) {
			this.es.drawPilotExperiment();
			this.es.updateParameterPilotExperiment(
				this.controllerPilotExperiment,
				Shape.overallParameter[
					String(this.controllerPilotExperiment.currentOrderRandomed)
				]
			);
		} else if (Shape.overallParameter.is_experiment) {
			this.es.draw();
			this.es.updateVAExperiment(
				Shape.overallParameter[
					String(this.controllerExperiment.currentOrder)
				]
			);
			this.es.updateParameterExperiment(
				Shape.overallParameter[
					String(this.controllerExperiment.currentOrder)
				]
			);
			this.es.parameter = Shape.overallParameter;
		} else {
			this.es.draw();
			this.es.updateVA();
			this.es.updateParameter();
			this.es.parameter = Shape.overallParameter;
		}
		p.pop();
	}

	handleBackground() {
		p.push();
		p.translate(p.width / 2, p.height / 2);
		let clientMap = Shape.overallParameter["clientMap"];

		// update EmotionalBackgrounds' parameter
		let client_number = 0;
		let storedList = [];
		// this.sortByVA();
		for (let user in clientMap) {
			client_number++;
			storedList.push(user);
			// create or update each user"s valence and arousal
			this.emotionalBackgroundParameterMap[user] = JSON.parse(
				JSON.stringify(clientMap[user])
			);
			// add information about unique order
			// i.e. create instance of EmotionalBackground when user is joining the system
			if (!Object.keys(this.ebMap).includes(user)) {
				this.ebMap[user] = new EmotionalBackground(
					this.emotionalBackgroundParameterMap,
					user,
					client_number,
					p
				);
			}
			// update each map
			this.ebMap[
				user
			].userParameter = this.emotionalBackgroundParameterMap[user];
			// update each parameter
			// let alpha = 0.8 / Shape.overallParameter.clientCount;
			let alpha = 0.8;
			this.ebMap[user].alpha = alpha;
			this.ebMap[user].draw({ is_background: true });
			this.ebMap[user].updateVA();
			this.ebMap[user].updateParameter();
		}
		p.pop();
	}

	// sort
	sortByVA() {
		let ebList = [];
		for (let eb in this.ebMap) {
			ebList.push(eb.valence);
		}
		ebList.sort((a, b) => {
			return a.valence < b.valence ? 1 : -1;
		});
	}

	handleUpdateParameterJSONPilotExperiment() {
		// for saving user-set parameter as a JSON file
		let currentParameter =
			Shape.overallParameter[
				String(this.controllerPilotExperiment.currentOrderRandomed)
			];
		currentParameter.sliderThetaSub = this.controllerPilotExperiment.controllerMap.sliderThetaSub.value();
		currentParameter.sliderVertexNum = this.controllerPilotExperiment.controllerMap.sliderVertexNum.value();
		currentParameter.sliderLengthCoefficient = this.controllerPilotExperiment.controllerMap.sliderLengthCoefficient.value();
		currentParameter.sliderAmplitude = this.controllerPilotExperiment.controllerMap.sliderAmplitude.value();
		currentParameter.sliderThetaBeat = this.controllerPilotExperiment.controllerMap.sliderThetaBeat.value();
		if (this.controllerPilotExperiment.isHue) {
			currentParameter.sliderHue = this.controllerPilotExperiment.controllerMap.sliderHue.value();
		}
	}

	handleUpdateParameterJSONExperiment() {
		// for saving user-set parameter as a JSON file
		let currentParameter =
			Shape.overallParameter[
				String(this.controllerExperiment.currentOrder)
			];
		currentParameter.userValence = parseFloat(
			this.controllerExperiment.htmlValence.value
		);
		currentParameter.userArousal = parseFloat(
			this.controllerExperiment.htmlArousal.value
		);
	}

	handleText() {
		p.strokeWeight(0);
		p.fill(0);
		let textSize = 20;
		p.text(
			"red: \t " +
				this.es.rgb.red +
				",\tgreen: \t" +
				this.es.rgb.green +
				",\tblue: \t" +
				this.es.rgb.blue,
			textSize,
			60
		);
		p.text("hue:\t " + this.es.hsb.hue, textSize, 90);
		p.text("saturation:\t" + this.es.hsb.saturation, textSize, 120);
		p.text("brightness:\t" + this.es.hsb.brightness, textSize, 150);
		p.text(
			"valence:\t" + Shape.overallParameter.average.valence,
			textSize,
			180
		);
		p.text(
			"arousal:\t" + Shape.overallParameter.average.arousal,
			textSize,
			210
		);
	}
}

new p5(sketch, "Container");
