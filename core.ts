import {
	Descriptor,
	DescriptorWith,
	DescriptorWithMetaMap,
	DescriptorWithMeta,
	Predicate,
	DescriptorOverride,
	PredicateFunc,
	DescriptorOverrideIndex,
} from './core.types';
import { EnvContextEntry } from './env/env.types';
import { getActiveEnvScope } from './env/env';

const reservedDescriptors = {} as {
	[name:string]: Descriptor<any>;
};

export function optional<T>(v: T): T | undefined {
	return v;
}

/** @param name — must be unique string constant (don't use interpolation or concatenation) */
export function createDescriptor<N extends string>(name: N): DescriptorWith<N> {
	const descriptor: DescriptorWith<N> = {
		id: name,
		name,
		isOptional: false,
		optional() {
			return Object.create(this, {isOptional: {value: true}});
		},
		withMeta: () => descriptor as any,
	};

	if (reservedDescriptors.hasOwnProperty(name)) {
		throw new Error(`[@truekit/core] Cannot redeclare descriptor '${name}'`);
	}

	reservedDescriptors[name] = descriptor;

	return descriptor;
}

export function createDescriptorWithMetaMap<T extends DescriptorWithMetaMap>(map: T): T {
	return map;
}

export function createPredicate<T extends object>(predicate?: Predicate<T>): PredicateFunc<T> {
	let fn: PredicateFunc<T> = null;

	if (typeof predicate === 'function') {
		fn = predicate;
	} else if (predicate != null) {
		const keys = Object.keys(predicate);
		const length = keys.length;

		fn = (props: T) => {
			let idx = length;
			while (idx--) {
				const key = keys[idx]
				if (props[key] !== predicate[key]) {
					return false;
				}
			}
			return true;
		};
	}

	return fn;
}

export function createDescriptorOverride<
	D extends DescriptorWithMeta<string, object>
>(
	Target: D,
	specificPath: DescriptorWithMeta<any, any>[],
	predicate?: Predicate<D['meta']>,
): DescriptorOverride {
	return {
		xpath: specificPath.concat(Target),
		predicate: createPredicate(predicate),
	};
}

export function createDescriptorOverrideIndex<
	T extends DescriptorOverride,
>(overrides: T[]): DescriptorOverrideIndex<T> {
	return overrides.reduce((index, override) => {
		const xpath = override.xpath.slice();
		const target = xpath.pop();

		index.set(
			target,
			(index.get(target) || [])
				.concat({
					...override,
					xpath,
				})
				.sort(descriptorOverrideComparator)
		);

		return index;
	}, new Map);
}

function descriptorOverrideComparator(a: DescriptorOverride, b: DescriptorOverride) {
	return getDescriptorOverrideWeight(b) - getDescriptorOverrideWeight(a);
}

function getDescriptorOverrideWeight(v: DescriptorOverride): number {
	return v.xpath.length + +(v.predicate !== null);
}

export function getDescriptorOverride<T extends DescriptorOverride>(
	list: T[],
	ctx: EnvContextEntry,
): T | null {
	let override: T | null = null;

	for (let i = 0, n = list.length; i < n; i++) {
		override = list[i];

		const {
			xpath,
			predicate,
		} = override;
		const scope = getActiveEnvScope();
		let cursor = scope;

		XPATH: for (let x = 0, xn = xpath.length; x < xn; x++) {
			const descr = xpath[x];

			while (cursor) {
				cursor = cursor.parent;

				if (cursor === null || cursor.ctx === ctx) {
					override = null;
					break XPATH;
				}

				if (cursor.owner === descr) {
					break;
				}
			}
		}

		if (override !== null && (predicate === null || (
			scope !== null
			&& scope.ctx !== null
			&& scope.ctx.props !== null
			&& predicate(scope.ctx.props)
		))) {
			return override;
		}
	}

	return override;
}