import { ThemeRules, ThemeRule } from './theme.types';
import { IRuleDefinitions, CSSMap, css } from '@artifact-project/css';

export function createToStringCode(code: string[], name: string, classes: object) {
	if (typeof classes === 'string') {
		code.push(`
			if (n === "${name}") {
				return (c || '');
			}
		`);
		return;
	}

	const str = Object.entries(classes).map(([key, val]) => {
		if (key === '$root') {
			return name === 'host' ? `(c.$root || '')` : '';
		} else if (typeof val === 'object') {
			return `(k = '${key}', s[k] ? (c[k].$root ? ' ' + c[k].$root : '') + ' ' + (c[k][s[k]] || '') : '')`;
		} else {
			return `(k = '${key}', s[k] ? ' ' + (c[k] || '') : '')`;
		}
	}).filter(x => !!x).join(' + ');

	code.push(`
		if (n === "${name}") {
			return (${str ? str : '""'});
		}
	`);
}

const SEP = '--';
const COLON_CODE = ':'.charCodeAt(0);

type SelectorToken = {
	type: '+' | '.' | 'fn' | ':';
	raw: string;
}

class Selector {
	constructor(raw: SelectorToken['raw'], type: SelectorToken['type'] = '.', private tokens: SelectorToken[] = []) {
		this.tokens.push({raw, type});
	}

	add(raw: SelectorToken['raw'], type: SelectorToken['type'] = '.') {
		return new Selector(raw, type, this.tokens.slice(0));
	}

	toString() {
		let fnOpened = false;
		let prevType: SelectorToken['type'];

		return this.tokens.reduce((s, {raw, type}, idx) => {
			if (type === '.') {
				if (raw === '&') {
					s += '.' + this.tokens[0].raw;
				} else if (prevType !== '.' && idx > 0) {
					s += '.' + this.tokens[0].raw + SEP + raw;
				} else {
					s += (prevType === '.' ? SEP : '.') + raw;
				}
			} else if (type === ':') {
				s += raw;
			} else {
				if (fnOpened) {
					s += ')';
					fnOpened = false;
				}

				if (type === '+') {
					s += ' + ';
				} else if (type === 'fn') {
					s += raw + '('
					fnOpened = true;
				}
			}

			if (fnOpened && (this.tokens.length - idx === 1)) {
				s += ')';
				fnOpened = false;
			}

			prevType = type;
			return s;
		}, '');
	}
}

export function convertThemeRulesToCSSRules(rules: ThemeRules<any>, css = {}) {
	Object.entries(rules).forEach(([name, rule]) => {
		convertThemeRuleToCSSRules(new Selector(name), rule, css);
	});

	return css as IRuleDefinitions;
}

function convertThemeRuleToCSSRules(sel: Selector, rule: ThemeRule<any, any>, css: object) {
	Object.entries(rule).forEach(([key, value]) => {
		if (value && typeof value === 'object') {
			if (key.charCodeAt(0) === COLON_CODE) {
				if (key === ':modifiers' || key === ':self') {
					convertThemeRuleToCSSRules(sel, value, css);
				} else if (key === ':not') {
					convertThemeRuleToCSSRules(sel.add(key, 'fn'), value, css);
				} else {
					convertThemeRuleToCSSRules(sel.add(key, ':'), value, css);
				}
			} else if (key === '+') {
				convertThemeRuleToCSSRules(sel.add('+', '+'), value, css);
			} else if (key === '&') {
				convertThemeRuleToCSSRules(sel.add('&'), value, css);
			} else {
				convertThemeRuleToCSSRules(sel.add(key), value, css);
			}
		} else {
			const name = sel.toString();
			css[name] = css[name] || {};
			css[name][key] = value;
		}
	});
}

export function convertCSSRulesToCSSClasses<T extends IRuleDefinitions>(rules: T): CSSMap<T> {
	return css(rules)
}

export function convertCSSClassesToThemeClasses<T extends IRuleDefinitions, M extends CSSMap<T>>(map: M) {
	const classes = {
	};

	Object.entries(map).forEach(([key, val]) => {
		const [elem, mod, state] = key.split(SEP);

		if (classes[elem] == null) {
			classes[elem] = map[elem] ? {$root: map[elem]} : {};
		}

		if (mod != null && !state && classes[elem][mod] == null) {
			classes[elem][mod] = val;
		}

		if (state != null) {
			if (!classes[elem][mod] || typeof classes[elem][mod] !== 'object') {
				classes[elem][mod] = classes[elem][mod] ? {$root: classes[elem][mod]} : {};
			}

			classes[elem][mod][state] = val;
		}
	});

	!classes.hasOwnProperty('host') && (classes['host'] = {});
	!classes.hasOwnProperty('elements') && (classes['elements'] = {});

	return classes;
}
