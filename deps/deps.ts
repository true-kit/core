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
	Descriptor,
} from '../core.types';
import { createElement } from 'react';

export const DepsProvider = createEnvContextProvider('deps');

let activeDepsScope = null as (null | any);

function scopeWrap(fn: any, injection: Map<string, any>): any {
	return function () {
		let prevScope = activeDepsScope;
		activeDepsScope = injection;

		const ret = fn.apply(this, arguments);

		activeDepsScope = prevScope;

		return ret;
	};
}

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

							if (result.hasOwnProperty(key)) {
								continue;
							}

							if (activeDepsScope && activeDepsScope.has(descr!.id)) {
								result[key] = activeDepsScope.get(descr!.id);
							} else if (injection.has(descr!.id)) {
								result[key] = scopeWrap(injection.get(descr!.id), injection);
							}

							if (--resolved == 0) {
								break MAIN;
							}
						}
					}
				}

				ctx = ctx.parent;
			}

			if (resolved > 0) {
				let i = mapEntriesLen;

				while (i--) {
					const [key, descr] = mapEntries[i];
					if (!result.hasOwnProperty(key) && !descr!.isOptional) {
						result[key] = createNullDep(descriptor, key, descr!);
					}
				}
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

function createNullDep(descr: Descriptor<any>, alias: string, depDescr: Descriptor<any>) {
	return () => createElement('i', {}, `
		Dep '${depDescr.name}' (aka '${alias}') not found
	`);
}