export class ThemeStyle {
	state = {};

	constructor(public name: string, public classes: object, private classNames: Function) {
		// console.log(name, classes, classNames.toString());
	}

	set(name: string, state: string | boolean) {
		this.state[name] = state;
		return this;
	}

	toString() {
		return this.classNames();
	}
}

ThemeStyle.prototype.constructor = String;