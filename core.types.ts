export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type UnionToIntersection<U> =
	(U extends any ? (inp: U) => void : never) extends ((out: infer I) => void)
		? I
		: never
;

export type ArrayInfer<T> = T extends (infer U)[] ? U : never;
export type FunctionInfer<F> = F extends (...args: infer A) => infer R ? [A, R] : never;
export type FirstArgInfer<F> = F extends (first: infer F) => any ? F : never;

export type Optional<T> = T | undefined;
export type IsOptional<T> = UnionToIntersection<T> extends undefined ? true : false;

export type FlattenObject<T extends object> = {[K in keyof T]: T[K]}
export type OptionalObject<T extends object> = FlattenObject<UnionToIntersection<{
	[K in keyof T]: IsOptional<T[K]> extends true
		? {[X in K]?: T[K]}
		: {[X in K]: T[K]}
}[keyof T]>>

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

export interface Descriptor<N extends string> {
	readonly id: N;
	readonly name: N;
	readonly isOptional: boolean;
	optional(): this | undefined;
}

export type DescriptorWithMeta<N extends string, M> = Descriptor<N> & {meta: M};

export type DescriptorWith<N extends string> = Descriptor<N> & {
	withMeta: <M>() => DescriptorWithMeta<N, M>;
}

export type DescriptorWithMetaMap = {
	[key:string]: DescriptorWithMeta<any, any> | undefined;
}


export type FlattenDescriptorWithMetaMap<
	T extends DescriptorWithMetaMap,
	KEYS extends string,
> = FlattenObject<__FlattenDescriptorWithMetaMap__<T, KEYS>>;

type __FlattenDescriptorWithMetaMapIterator__<
	T extends DescriptorWithMeta<any, any>,
	KEYS extends string,
> = {
	[X in T['id']]: T['meta'];
} | (T['meta'] extends {[X in KEYS]?: DescriptorWithMetaMap} ? {
	[X in KEYS]: __FlattenDescriptorWithMetaMap__<
		NonNullable<T['meta'][X]>,
		KEYS
	>;
}[KEYS] : never)

type __FlattenDescriptorWithMetaMap__<
	T extends DescriptorWithMetaMap,
	KEYS extends string,
> = UnionToIntersection<{
	[K in keyof T]: __FlattenDescriptorWithMetaMapIterator__<NonNullable<T[K]>, KEYS>;
}[keyof T]>;