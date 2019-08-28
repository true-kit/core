import { createElement, ReactElement, cloneElement } from 'react';
import { ComponentDescriptor, ComponentRender, SlotElement, SlotContent } from './component.types';
import { createDescriptor, getDescriptorOverride } from '../core';
import {
	createDepsDescriptor,
	createDepsBy,
	createStrictDepsBy,
} from '../deps';
import { DescriptorWithMetaMap } from '../core.types';
import { withEnvScope, getActiveEnvScope, getEnvContext } from '../env/env';
import { useTheme, createThemeFor } from '../theme';
import { EnvContextProps } from '../env/env.types';

export function createComponentDescriptor<
	N extends string,
	P extends object,
	DM extends DescriptorWithMetaMap,
>(
	name: N,
	props: P,
	deps?: DM,
): ComponentDescriptor<N, P, DM> {
	const $descriptor = createDescriptor(name).withMeta<P>() as ComponentDescriptor<N, P, DM>;
	const $deps = createDepsDescriptor($descriptor, Object(deps));

	$descriptor.deps = $deps;
	$descriptor.props = props;

	$descriptor.createComponent = (render) => createComponent($descriptor, render);
	$descriptor.createTheme = (rules) => createThemeFor($descriptor, rules);
	$descriptor.createDeps = (deps) => createDepsBy($deps, deps as any);
	$descriptor.createStrictDeps = (deps) => createStrictDepsBy($deps, deps as any);

	return $descriptor;
}

export function createComponent<
	D extends ComponentDescriptor<any, any, any>,
>(
	$descriptor: D,
	render: ComponentRender<D>,
): (props: D['meta']) => ReactElement {
	const $deps = $descriptor.deps;

	function Component(props: D['meta']) {
		const entry: EnvContextProps = {
			deps: null,
			theme: null,
			depsInjection: null,
			props,
		};

		return withEnvScope($descriptor, entry, () => {
			const ctx = getEnvContext();
			const overrides = ctx !== null && ctx.deps !== null ? ctx.deps.overrides : null;

			if (overrides !== null && overrides.has($descriptor)) {
				const override = getDescriptorOverride(overrides.get($descriptor)!, ctx!);

				if (override !== null && override.value !== Component) {
					return override.value(props);
				}
			}

			const theme = useTheme($descriptor, props, ctx);
			const deps = $deps.use(props, ctx);

			return render(
				createElement,
				props,
				{theme, Slot} as any,
				deps as any,
			);
		});
	}

	Component.$descriptor = $descriptor;
	Component.displayName = $descriptor.name;

	return Component;
}

type SlotProps = {
	name: string;
	value: any;
	children: React.ReactNode;
	is?: SlotElement | [SlotElement, SlotElement];
}

function Slot({name, children, value, is}: SlotProps) {
	if (name == null) {
		name = 'children';
	}

	const envScope = getActiveEnvScope();
	const scopeProps = (envScope !== null && envScope.ctx !== null) ? envScope.ctx.props : null;
	const content = scopeProps != null ? scopeProps[name] : undefined;

	if (is) {
		if (!is.hasOwnProperty('type')) {
			is = is[0] === null ? null : (is[0] || is[1] || null);
		}
	} else {
		is = null;
	}

	// Слот не нужен, так сказали свыше!
	if (content === null) {
		return null;
	}

	// Переопределение слота
	if (content !== undefined) {
		// Это перегрузка
		if (typeof content === 'function') {
			const result = content(children, value);

			// Слот не нужен
			if (result === null) {
				return null;
			} else if (result !== undefined) {
				return wrap(result, is);
			}
		} else {
			return wrap(content, is);
		}
	}

	// Значение есть, но оно именно null
	if (children === null) {
		return null;
	} else if (children === undefined) {
		return is; // возвращаем оборачиващий элемент
	}

	if (typeof children === 'function') {
		return wrap(children(value), is);
	}

	return wrap(children, is);
}

function wrap(content: any, is: any) {
	if (is !== null) {
		content = content && cloneElement(
			is as React.ReactElement,
			is.props,
			content,
		);
	}

	return content;
}
