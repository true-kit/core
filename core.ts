import {
	Descriptor,
	DescriptorWith,
	DescriptorWithMetaMap,
} from './core.types';

const reservedDescriptors = {} as {
	[name:string]: Descriptor<any>;
};

export function optional<T>(v: T): T | undefined {
	return v;
}

/** @param name — must be unique string constant (don't use interpolation or concatenation) */
export function createDescriptor<N extends string>(name: N): DescriptorWith<N> {
	const descriptor: Descriptor<N> = {
		id: name,
		name,
		isOptional: false,
		optional() {
			return Object.create(this, {isOptional: {value: true}});
		},
	};

	if (reservedDescriptors.hasOwnProperty(name)) {
		throw new Error(`[@truekit/core] Cannot redeclare descriptor '${name}'`);
	}

	reservedDescriptors[name] = descriptor;

	return {
		...descriptor,
		withMeta: () => descriptor as any,
	};
}

export function createDescriptorWithMetaMap<T extends DescriptorWithMetaMap>(map: T): T {
	return map;
}