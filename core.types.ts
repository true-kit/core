export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type ArrayInfer<T> = T extends (infer U)[] ? U : never;
export type FunctionInfer<F> = F extends (...args: infer A) => infer R ? [A, R] : never;

export type FlattenObject<T extends object> = {
	[K in keyof T]: T[K];
}

export type Params<F extends (...args: any[]) => any> =
	F extends (...args: infer A) => any
		? A
		: never
;

export type Head<T extends any[]> = T extends [any, ...any[]]
	? T[0]
	: never
;

export type Tail<T extends any[]> =
	((...args: T) => any) extends ((_: any, ...tail: infer TT) => any)
		? TT
		: []
;

export type HasTail<T extends any[]> = T extends ([] | [any]) ? false : true;

export type Last<T extends any[]> = {
	0: Last<Tail<T>>
	1: Head<T>
}[HasTail<T> extends true ? 0 : 1];

export type Length<T extends any[]> = T['length'];

export type Prepend<E, T extends any[]> =
	((head: E, ...args: T) => any) extends ((...args: infer U) => any)
		? U
		: T
;

export type Cast<X, Y> = X extends Y ? X : Y;

export type UnionToIntersection<U> =
	(U extends any ? (inp: U) => void : never) extends ((out: infer I) => void)
		? I
		: never
;

export interface Descriptor<N extends string> {
	readonly id: N;
	readonly name: N;
}

export type DescriptorWithMeta<N extends string, M> = Descriptor<N> & {meta: M};

export type DescriptorWith<N extends string> = Descriptor<N> & {
	withMeta: <M>() => DescriptorWithMeta<N, M>;
}

export type DescriptorWithMetaMap = {
	[key:string]: DescriptorWithMeta<any, any>;
}

type __FlattenDescriptorWithMetaMap__<
	T extends DescriptorWithMetaMap,
	KEYS extends string,
> = UnionToIntersection<{
	[K in keyof T]: {
		[X in T[K]['id']]: T[K]['meta'];
	} | (T[K]['meta'] extends {[X in KEYS]?: DescriptorWithMetaMap} ? {
		[X in KEYS]: __FlattenDescriptorWithMetaMap__<
			NonNullable<T[K]['meta'][X]>,
			KEYS
		>;
	}[KEYS] : never)
}[keyof T]>;

export type FlattenDescriptorWithMetaMap<
	T extends DescriptorWithMetaMap,
	KEYS extends string,
> = FlattenObject<__FlattenDescriptorWithMetaMap__<T, KEYS>>;

const reservedDescriptors = {} as {[name:string]: Descriptor<any>};

/** @param name — must be unique string constant (don't use interpolation or concatenation) */
export function createDescriptor<N extends string>(name: N): DescriptorWith<N> {
	const descriptor: Descriptor<N> = {
		id: name,
		name,
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