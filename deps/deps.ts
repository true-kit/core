import { Deps, DepsRegistry, LikeComponent } from './deps.types';
import { createEnvContextProvider, getEnvContext } from '../env/env';

export const DepsProvider = createEnvContextProvider('deps');

export function getDeps<
	D extends Deps<any>,
	P extends {deps?: D},
>(
	Target: (props: P) => JSX.Element,
	props: P,
): NonNullable<P['deps']> {
	if (props.deps) {
		return props.deps!;
	}

	let ctx = getEnvContext();
	while (ctx) {
		const {deps} = ctx;

		if (deps !== null && deps.map !== null && deps.map.has(Target)) {
			return deps.map.get(Target) as any;
		}

		ctx = ctx.parent;
	}

	return {} as any;
}

type DepsInjection = {
	Target: LikeComponent<any>;
	map: Deps<any>;
}

export function createDepsFor<P extends {deps?: Deps<any>}>(Target: LikeComponent<P>) {
	return (map: NonNullable<P['deps']>): DepsInjection => ({
		Target,
		map,
	});
}

export function createDepsRegistry(deps: DepsInjection[] | null): DepsRegistry {
	return {
		map: !deps ? null : deps.reduce((map, dep) => {
			map.set(dep.Target, dep.map);
			return map;
		}, new Map as NonNullable<DepsRegistry['map']>),

		overrides: null,
	};
}