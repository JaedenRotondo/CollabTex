import { tv, type VariantProps } from 'tailwind-variants';
export { default as Button } from './button.svelte';

export const buttonVariants = tv({
	base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academic-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	variants: {
		variant: {
			default: 'bg-academic-primary text-white hover:bg-academic-primary-dark shadow-sm hover:shadow-md',
			destructive: 'bg-academic-error text-white hover:bg-red-700',
			outline: 'border border-academic-gray-300 bg-academic-paper hover:bg-academic-gray-50 text-academic-gray-700 hover:text-academic-gray-900',
			secondary: 'bg-academic-gray-100 text-academic-gray-900 hover:bg-academic-gray-200',
			ghost: 'text-academic-gray-700 hover:bg-academic-gray-100 hover:text-academic-gray-900',
			link: 'text-academic-primary underline-offset-4 hover:underline'
		},
		size: {
			default: 'h-10 px-4 py-2',
			sm: 'h-9 rounded-md px-3',
			lg: 'h-11 rounded-md px-8',
			icon: 'h-10 w-10'
		}
	},
	defaultVariants: {
		variant: 'default',
		size: 'default'
	}
});

export type Variant = VariantProps<typeof buttonVariants>['variant'];
export type Size = VariantProps<typeof buttonVariants>['size'];
