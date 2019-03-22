import {
	Deps,
	DepsDescriptor,
	DepsInjection,
	DepsRegistry,
} from './deps.types';

import {
	getEnvContext,
	createEnvContextProvider,
} from '../env/env';

import {
	DescriptorWithMeta,
	DescriptorWithMetaMap,
} from '../core.types';

export const DepsProvider = createEnvContextProvider('deps');

export function createDepsDescriptorFor<
	D extends DescriptorWithMeta<any, any>,
	M extends DescriptorWithMetaMap,
>(descriptor: D, map: M): DepsDescriptor<D, M> {
	const mapEntries = Object.entries(map);
	const mapEntriesLen = mapEntries.length;

	return {
		descriptor,
		map,

		use(props) {
			if (hasDepsProp(props)) {
				return props.deps;
			}

			const result = {};
			let resolved = mapEntriesLen;
			let ctx = getEnvContext();

			MAIN: while (ctx) {
				const deps = ctx.deps;

				if (deps) {
					const {
						map:depsFor,
					} = deps;

					if (depsFor && depsFor.has(descriptor.id)) {
						const injection = depsFor.get(descriptor.id)!;
						let i = mapEntriesLen;

						while (i--) {
							const [key, descr] = mapEntries[i];

							if (!result.hasOwnProperty(key) && injection.has(descr!.id)) {
								result[key] = injection.get(descr!.id);

								if (--resolved == 0) {
									break MAIN;
								}
							}
						}
					}
				}

				ctx = ctx.parent;
			}

			return result as any;
		},
	};
}

export function createDepsInjectionFor<
	DD extends DepsDescriptor<any, any>,
>(deps: DD, map: Partial<DepsInjection<DD['map']>>) {
	return {
		deps,
		map,
	};
}

export function createDepsInjectionForAll<
	DD extends DepsDescriptor<any, any>,
>(deps: DD, map: Required<DepsInjection<DD['map']>>) {
	return {
		deps,
		map,
	};
}

export function createDepsRegistry(
	list: Array<{deps: DepsDescriptor<any, any>; map: DepsInjection<any>}>
): DepsRegistry {
	return {
		map: !list ? null : list.reduce((index, entry) => {
			index.set(
				entry.deps.descriptor.id,
				Object.entries(entry.map).reduce((map, [id, Component]) => {
					map.set(id, Component);
					return map;
				}, new Map),
			);
			return index;
		}, new Map),
	};
}

function hasDepsProp(props: object): props is Deps<any> {
	return props.hasOwnProperty('deps');
}
