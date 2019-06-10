export class ThemeStyler {
	state = {};

	constructor(public name: string, public classes: object, private classNames: Function) {
		// console.log(name, classes, classNames.toString());
	}

	set(name: string, state: string | boolean) {
		this.state[name] = state;
		return this;
	}

	toDOMProps<T>(props: React.AllHTMLAttributes<T> = {}): React.AllHTMLAttributes<T> {
		props.className = (this as any) as string;
		return props;
	}

	toString() {
		return this.classNames();
	}
}

ThemeStyler.prototype.constructor = String;