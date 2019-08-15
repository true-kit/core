import {
	Deps,
	DepsDescriptor,
	DepsMapBy,
	DepsRegistry,
	DepOverride,
	DepsMap,
} from './deps.types';

import {
	getEnvContext,
	createEnvContextProvider,
	withEnvScope,
} from '../env/env';

import {
	DescriptorWithMeta,
	DescriptorWithMetaMap,
	Descriptor,
	Predicate,
	LikeComponent,
} from '../core.types';

import { createElement } from 'react';
import { EnvContextProps } from '../env/env.types';
import { createDescriptorOverrideIndex, createDescriptorOverride } from '../core';

export const DepsProvider = createEnvContextProvider('deps');

export function createDepsDescriptor<
	D extends DescriptorWithMeta<any, any>,
	M extends DescriptorWithMetaMap,
>(descriptor: D, map: M): DepsDescriptor<D, M> {
	const mapEntries = Object.entries(map);
	const mapEntriesLen = mapEntries.length;

	return {
		descriptor,
		map,

		use(props, ctx) {
			const result = {};

			if (!mapEntriesLen) {
				return result;
			}

			let resolved = mapEntriesLen; // количество зависимостей, которые нужно зарезолвить

			if (ctx === null) {
				ctx = getEnvContext();
			}

			if (hasDepsProp(props)) {
				for (let key in props.deps) {
					if (props.deps.hasOwnProperty(key) && map.hasOwnProperty(key)) {
						result[key] = props.deps[key];
						resolved--;
					}
				}

				if (resolved === 0) {
					return result;
				}
			}

			MAIN: while (ctx) {
				const depsRegistry = ctx.deps;
				let i = mapEntriesLen;

				if (depsRegistry && i > 0) {
					const {
						map:depsMap,
					} = depsRegistry;

					if (depsMap !== null) {
						while (i--) {
							const [depAs, dd] = mapEntries[i];

							if (depsMap.hasOwnProperty(dd!.id) && !result.hasOwnProperty(depAs)) {
								result[depAs] = depsMap[dd!.id];

								if (--resolved == 0) {
									break MAIN;
								}
							}
						}
					}
				}

				ctx = ctx.parent;
			}

			// Резолвим зависимости, которые не нашли на пустышки,
			// чтобы избежать ошибок при рендере, ну и сообщить об этом разработчику
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

export function createDeps<T extends DepsMap>(map: T): T {
	return map;
}

export function createDepsBy<
	DD extends DepsDescriptor<any, any>,
>(_: DD, map: Partial<DepsMapBy<DD['map']>>): DepsMap {
	return Object(map);
}

export function createStrictDepsBy<
	DD extends DepsDescriptor<any, any>,
>(_: DD, map: DepsMapBy<DD['map']>): DepsMap {
	return Object(map);
}

export function createDepsRegistry(
	list: Array<DepsMap>,
	overrides?: DepOverride[],
): DepsRegistry {
	return {
		map: !list.length ? null : list.reduce((map, entry) => ({
			...map,
			...Object(entry),
		}), {}),

		overrides: !overrides ? null : createDescriptorOverrideIndex(overrides),
	};
}


function hasDepsProp(props: object): props is Deps<any> {
	return props.hasOwnProperty('deps');
}

function createNullDep(_: Descriptor<any>, alias: string, depDescr: Descriptor<any>) {
	// @todo: Логгер
	return () => createElement('i', {}, `
		Dep '${depDescr.name}' (aka '${alias}') not found
	`);
}

function addEnvScope(target: Function, depsInjection: Map<string, LikeComponent<any>>) {
	return (...args: any[]) => {
		const entry: EnvContextProps = {
			deps: null,
			theme: null,
			depsInjection,
			props: null,
		};
		return withEnvScope(null, entry, () => target(...args));
	};
}

function resolveDeps(
	result: object,
	entry: [string, Descriptor<any> | undefined],
	injection: Map<string, LikeComponent<any>>,
	useEnvScope: boolean,
) {
	const [key, descr] = entry!;

	if (result.hasOwnProperty(key)) {
		return false;
	}

	if (injection.has(descr!.id)) {
		result[key] = injection.get(descr!.id);

		if (useEnvScope) {
			result[key] = addEnvScope(result[key], injection);
		}

		return true;
	}
}

export function createDepOverride<
	D extends DescriptorWithMeta<string, object>
>(
	$Target: D,
	specificPath: DescriptorWithMeta<string, object>[],
	predicate?: Predicate<D['meta']>,
): (
	Replacement: LikeComponent<D['meta']>,
) => DepOverride {
	return (value) => ({
		...createDescriptorOverride($Target, specificPath, predicate),
		value,
	});
}