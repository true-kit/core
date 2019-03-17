import { IRuleDefinitions } from '@artifact-project/css';

export type LikeComponent<T extends Theme<any>> = (props: {theme?: T}) => any;
export type GetComponentTheme<C> = C extends (props: {theme?: infer T}) => any ? T : never;

export type ThemeModsSpec = {
	[name:string]: string | boolean | undefined;
}

export type ThemeElementsSpec = {
	[name:string]: boolean | ThemeModsSpec;
}

export type ThemeSpec = {
	host: ThemeModsSpec;
	elements: ThemeElementsSpec;
}

export type Theme<TS extends ThemeSpec> = {
	readonly spec: {
		host: Required<TS['host']>;
		elements: Required<TS['elements']>;
	};
	readonly Owner: LikeComponent<Theme<TS>>;
	readonly cssRules: IRuleDefinitions;
	readonly registry: object | null;

	readonly classes: {
		host: ThemeClasses<TS['host']>;
		elements: ThemeElementsClasses<TS['elements']>
	}

	// Get theme from `host` or element
	for<
		K extends keyof TS['elements'],
		N extends 'host' | K,
	>(name: N): N extends K
		? string & ThemeElement<N, TS['elements'][K]>
		: string & ThemeElement<N, TS['host']>
	;

	withRegistry(registry: object): Theme<TS>;
}

export type ThemeClasses<T extends ThemeModsSpec> = {$root: string} & {
	[K in keyof T]: string;
};

export type ThemeElementsClasses<T extends ThemeElementsSpec> = {
	[K in keyof T]?: T[K] extends ThemeModsSpec ? ThemeClasses<T[K]> : {$root: string};
};

export type ThemeElement<N, T extends boolean | ThemeModsSpec> = {
	name: N;
	toString(): string;
} & (T extends ThemeModsSpec
	? {
		set<K extends keyof T>(name: K, state: T[K]): ThemeElement<N, T>;
		classes: {$root: string} & {[K in keyof T]: string};
	}
	: {
		set(): ThemeElement<N, T>;
		classes: {$root: string};
	}
);

export type CSSProps = Partial<React.CSSProperties>;

// Rule
export type ThemeRule<
	M extends ThemeModsSpec | ThemeElementsSpec,
	E extends ThemeElementsSpec,
	A extends ThemeModsSpec | ThemeElementsSpec = E, // Adjacent Sibling Selector
> = CSSProps
	& ThemePseudoRules<M, E>
	& ThemeNotRule<M, E, A>
	& ThemeSelfRefRule<M, E, A>
	& {
	'+'?: ThemeRule<M, E, A>
	':nested'?: ThemeAnyRule & ThemeElementsRules<E> & ThemeNotRule<M, E>;
}

// '*' — AnyRule
export type ThemeAnyRule = {
	'*'?: {
		[selector:string]: CSSProps;
	};
};

// ':not(...)'
export type ThemeNotRule<
	M extends ThemeModsSpec | ThemeElementsSpec,
	E extends ThemeElementsSpec,
	A extends ThemeModsSpec | ThemeElementsSpec = E,
> = {
	':not'?: ThemeSelfRefRule<M, E, A> & ThemePseudoRules<M, E> & {
		[K in keyof M]?: M[K] extends string
			? {[V in M[K]]?: ThemeRule<M, E>}
			: (M[K] extends ThemeModsSpec
				? ThemeRule<M[K], E> & ThemeModifiersRule<M[K], E>
				: ThemeRule<M, E>
			)
	};
}

// '&' — Self reference rule
export type ThemeSelfRefRule<
	M extends ThemeModsSpec | ThemeElementsSpec,
	E extends ThemeElementsSpec,
	A extends ThemeModsSpec | ThemeElementsSpec = E,
> = A extends ThemeModsSpec
	? ThemeAnyRule & ThemeNotRule<M, E> & {
		'&'?: (M extends ThemeElementsSpec
			? ThemeRule<M, E, A> & ThemeModifiersRule<A, E>
			: ThemeHostRule<A, E>
		);
	}

	: ThemeElementsRules<E> & ThemeAnyRule & ThemeNotRule<M, E> & {
		'&'?: (M extends ThemeModsSpec
			? ThemeRule<A, E> & ThemeModifiersRule<M, E>
			: ThemeRule<A, E>
		);
	}
;

// ':pseudo' — Pseudo selector rule
export type ThemePseudoRules<
	M extends ThemeModsSpec | ThemeElementsSpec,
	E extends ThemeElementsSpec,
> = {
	':first-child'?: ThemeRule<M, E>;
	':last-child'?: ThemeRule<M, E>;
	':before'?: ThemeRule<M, E>;
	':after'?: ThemeRule<M, E>;
	':hover'?: ThemeRule<M, E>;
	':active'?: ThemeRule<M, E>;
	':visited'?:ThemeRule<M, E>;
	':focus'?: ThemeRule<M, E>;
}

// Rules for 'host' & 'elements'
export type ThemeRules<T extends ThemeSpec> = {
	host: ThemeHostRule<T['host'], T['elements']>;
	elements: ThemeElementsRules<T['elements']>;
}

// ':host' — Host Rule
export type ThemeHostRule<
	M extends ThemeModsSpec, // Modifiers
	E extends ThemeElementsSpec, // Elements
> = ThemeRule<M, E, M> & ThemeModifiersRuleWithSelf<M, E>;

// Modifiers Rule
export type ThemeModifiersRule<
	M extends ThemeModsSpec, // Modifiers
	E extends ThemeElementsSpec,
> = {
	':modifiers'?: {
		[K in keyof M]?: M[K] extends string
			? {[V in M[K]]?: ThemeRule<M, E>}
			: ThemeRule<M, E>
	};
}

export type ThemeModifiersRuleWithSelf<
	M extends ThemeModsSpec, // Modifiers
	E extends ThemeElementsSpec,
> = {
	':modifiers'?: {
		[K in keyof M]?: M[K] extends string
			? {[V in M[K]]?: ThemeRule<M, E>} & {':self'?: ThemeRule<M, E>}
			: ThemeRule<M, E>
	};
}

export type ThemeElementsRules<E extends ThemeElementsSpec> = {
	[K in keyof E]?: E[K] extends ThemeModsSpec
		? ThemeRule<E, E> & ThemeModifiersRule<E[K], E>
		: ThemeRule<E, E>
	;
}

export type ThemeRegistry = {
	map: Map<LikeComponent<any>, Theme<any>>;
	overrides: ThemeOverrideIndex;
}

export type ThemeOverride = {
	theme: Theme<any>;
	xpath: LikeComponent<any>[];
}

export type ThemeOverrideIndex = Map<LikeComponent<any>, ThemeOverride>;

export type ThemeProviderValue = {
	parent?: ThemeProviderValue;
	value: ThemeRegistry;
}

export type ThemeProviderProps = {
	value: ThemeRegistry;
	children: React.ReactNode | React.ReactNode[];
}

export type ThemeScopeEnv = null | {
	parent: ThemeScopeEnv;
	Owner: LikeComponent<any>;
	ctx?: ThemeProviderValue;
}