import { Deps } from './deps.types';

export function getDeps<
	D extends Deps<any>,
	P extends {deps?: D},
>(
	Target: (props: P) => JSX.Element,
	props: P,
): NonNullable<P['deps']> {
	return Object(props.deps);
}