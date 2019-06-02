import {
	Deps,
	DepsDescriptor,
	DepsInjection,
	DepsRegistry,
	LikeComponent,
} from './deps.types';

import {
	getEnvContext,
	createEnvContextProvider,
	withEnvScope,
	getActiveEnvScope,
} from '../env/env';

import {
	DescriptorWithMeta,
	DescriptorWithMetaMap,
	Descriptor,
} from '../core.types';
import { createElement } from 'react';
import { EnvContextProps } from '../env/env.types';

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
			let resolved = mapEntriesLen; // количество зависимостей, которые нужно зарезолвить
			let ctx = getEnvContext();

			MAIN: while (ctx) {
				const deps = ctx.deps;
				let envScope = getActiveEnvScope();
				let i = mapEntriesLen;

				if (deps && i > 0) {
					const {map:depsFor} = deps;

					while (envScope) {
						const injection = envScope.ctx && envScope.ctx.depsInjection;

						if (injection) {
							while (i--) {
								if (resolveDeps(result, mapEntries[i], injection)) {
									if (--resolved == 0) {
										break MAIN;
									}
								}
							}
						}

						envScope = envScope.parent;
					}

					if (depsFor && depsFor.has(descriptor.id)) {
						const injection = depsFor.get(descriptor.id)!;

						while (i--) {
							if (resolveDeps(result, mapEntries[i], injection, true)) {
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
	useEnvScope?: boolean,
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