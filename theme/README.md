@truekit/core: theme
--------------------
Theme in JS based on [@artifact-project/css](https://github.com/artifact-project/css)

```sh
npm i --save-dev @truekit/core
```

---

### Usage

```tsx
import { Theme, createThemeFor } from '@truekit/core/theme';

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

const theme = createThemeFor($Text, {
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