export type ArrayInfer<T> = T extends (infer U)[] ? U : never;
export type FunctionInfer<F> = F extends (...args: infer A) => infer R ? [A, R] : never;

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

export type Cast<X, Y> = X extends Y ? X : Y;