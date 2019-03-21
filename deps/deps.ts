import { LikeComponent, DepsDescriptor, DepsProps, Deps, DepsInjection } from './deps.types';
import { createEnvContextProvider, getEnvContext } from '../env/env';
import { DescriptorWithMetaMap, DescriptorWithMeta } from '../core.types';

export const DepsProvider = createEnvContextProvider('deps');

export function createDepsDescriptorFor<
	P extends object,
	M extends DescriptorWithMetaMap,
>(descriptror: DescriptorWithMeta<any, P>, map: M): DepsDescriptor<M, P> {
	return {
		value: {} as M,

		use(props) {
			if (hasDepsProp(props)) {
				return props.deps;
			}

			return {} as any;
		},
	};
}

export function createDepsInjectionFor<
	DD extends DepsDescriptor<any, any>,
>(_: DD, map: Partial<DepsInjection<DD['value']>>) {
	return map;
}

export function createDepsInjectionForAll<
	DD extends DepsDescriptor<any, any>,
>(_: DD, map: Required<DepsInjection<DD['value']>>) {
	return map;
}

function hasDepsProp(props: object): props is Deps<any> {
	return props.hasOwnProperty('deps');
}
