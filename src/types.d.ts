declare module 'markdown-it-mark';

// Code Input Web Component types
declare namespace JSX {
	interface IntrinsicElements {
		'code-input': {
			language?: string;
			template?: string;
			placeholder?: string;
			value?: string;
			'data-gramm'?: string;
			spellcheck?: string;
			onInput?: (event: Event) => void;
			onFocus?: (event: Event) => void;
		};
	}
}
