@truekit/core: theme
--------------------
Theme in JS based on [@artifact-project/css](https://github.com/artifact-project/css)

```sh
npm i --save-dev @truekit/core
```

---

### Usage

```tsx
import { Theme, getTheme, createThemeFor } from '@truekit/core/theme';

// Describe some component props
type TextProps = {
	size?: 'big' | 'small';
	disabled?: boolean;
	icon?: string;
	iconAlign?: 'left' | 'right';
	value: string;

	// Describe theme for this component as him prop
	theme?: Theme<{
		// root/host element and him modifiers
		host: Pick<TextProps, 'size' | 'disabled'> & {
			multiline: 'on' | 'off';
		};

		// Nested elements section
		elements: {
			// Nested element with modifiers
			icon: {
				align: TextProps['iconAlign'];
			};

			// without modifiers
			value: true;
		};
	}>;
};

// Describe component
function Text(props: TextProps) {
	const {size, disabled, value, icon, iconAlign} = props;
	const theme = getTheme(Text, props);

	// Host
	const hostTheme = theme.for('host');
	size && hostTheme.set('size', size);
	disabled && hostTheme.set('disabled', true);

	// Icon
	const iconTheme = theme.for('icon');
	iconAlign && iconTheme.set('align', iconAlign);

	return (
		<div className={hostTheme}>
			{icon && <span className={iconTheme}><img src={icon}/></span>}
			<span className={theme.for('value')}>{value}</span>
		</div>
	);
}

const theme = createThemeFor(Text)({
	host: {
		color: '#333',

		':modifiers': {
			size: {
				':self': {fontSize: '100%'},
				big: {fontSize: '200%'},
				small: {fontSize: '50%'},
			},

			disabled: {
				opacity: .5,
			},
		},
	},

	elements: {
		value: {display: 'inline-block'},
		icon: {
			':self': {display: 'inline-block'},
			':modifiers': {
				right: {float: 'right'},
			},
		},
	},
});
```