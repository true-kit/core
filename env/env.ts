import {
	Fragment,
	createElement,
	createContext,
	useContext,
} from 'react';

import {
	EnvContextProps,
	EnvScope,
	EnvContextEntry,
	EnvContextProviderProps,
} from './env.types';

let activeEnvScope: EnvScope = null;
let envScopeEndAnchor = () => {
	// @todo: проверить, как вё это работает с React Fiber
	if (activeEnvScope !== null) {
		// const Owner = activeEnvScope.Owner
		// console.log('End:', Owner && Owner.name);
		activeEnvScope = activeEnvScope.parent;
	}

	return null;
};

export const EnvContext = createContext<EnvContextEntry>({
	parent: null,
	deps: null,
	depsInjection: null,
	theme: null,
	props: null,
});

export function withEnvScope<R>(
	owner: any | null,
	ctx: EnvContextProps | null,
	executer: () => R,
): R {
	const overrideEnabled = (ctx || activeEnvScope) !== null;

	if (overrideEnabled) {
		const envScope: EnvScope = {
			parent: activeEnvScope,
			owner,
			ctx,
		};

		activeEnvScope = envScope;
	}

	if (ctx !== null && activeEnvScope !== null && ctx.props === null && activeEnvScope.ctx !== null) {
		ctx.props = activeEnvScope.ctx.props;
	}

	const fragment = executer();

	if (overrideEnabled) {
		// console.log('Start:', Owner && Owner.name);
		// @todo: проверить наличие чайлдов, и если их нет, сразу возвращать `activeEnvScope`
		return createElement(Fragment, null, fragment, createElement(envScopeEndAnchor)) as any as R;
	}

	return fragment;
}

export function getActiveEnvScope() {
	return activeEnvScope;
}

export function getEnvContext(): EnvContextEntry | null {
	const ctx = useContext(EnvContext);
	return ctx || null;
}

export function createEnvContextProvider<K extends keyof EnvContextProps>(key: K) {
	function Provider(props: EnvContextProviderProps<K>) {
		const next: EnvContextEntry = {
			parent: getEnvContext(),
			deps: null,
			depsInjection: null,
			theme: null,
			props: null,
		};
		next[key] = props.value;

		return withEnvScope(null, next, () => {
			return createElement(EnvContext.Provider, {value: next}, props.children);
		});
	}

	Provider['displayName'] = `${key.charAt(0).toUpperCase() + key.substr(1)}ContextProvider`;

	return Provider;
}
