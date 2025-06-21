
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'inter': ['Inter', 'sans-serif'],
				'satoshi': ['Satoshi', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// DecentraTune Brand Colors
				// New Dual Theme Color Palette
				// Light Mode Colors (defaults, also used for :root CSS vars)
				'light-background': '#F9FAFB',
				'light-card-surface': '#FFFFFF',
				'light-text-primary': '#111827',
				'light-text-secondary': '#6B7280',
				'light-accent-primary': '#7C3AED',
				'light-accent-hover': '#6D28D9',
				'light-borders-lines': '#E5E7EB',
				'light-success': '#16A34A',
				'light-error': '#DC2626',

				// Dark Mode Colors (used for .dark CSS vars and Tailwind dark: utilities)
				'dark-background': '#0B0C10',
				'dark-card-surface': '#1C1E26',
				'dark-text-primary': '#F5F5F5',
				'dark-text-secondary': '#9CA3AF',
				'dark-accent-primary': '#7C3AED', // Same as light for primary accent
				'dark-accent-hover': '#9F67FF',
				'dark-borders-lines': '#2A2F3A',
				'dark-success': '#22C55E',
				'dark-error': '#EF4444',

				// Generic names for easier usage with CSS variables approach (optional if only using TW classes)
				// These will be overridden by .dark variants
				background: 'var(--color-background)',
				'card-surface': 'var(--color-card-surface)',
				'text-primary': 'var(--color-text-primary)',
				'text-secondary': 'var(--color-text-secondary)',
				'accent-primary': 'var(--color-accent-primary)',
				'accent-hover': 'var(--color-accent-hover)',
				'borders-lines': 'var(--color-borders-lines)',
				success: 'var(--color-success)',
				error: 'var(--color-error)',

				// DecentraTune specific colors defined via CSS variables
        'dt-primary': 'var(--dt-primary)',
        'dt-primary-dark': 'var(--dt-primary-dark)',
        'dt-secondary': 'var(--dt-secondary)',
        'dt-accent': 'var(--dt-accent)',
        'dt-gray-light': 'var(--dt-gray-light)',
        'dt-dark': 'var(--dt-dark)',

				// Original dt colors can be removed or kept if still needed for specific old components
				// For now, we'll comment them out to prioritize the new theme.
				// dt: {
				// 	primary: '#3B82F6',
				// 	'primary-dark': '#1D4ED8',
				// 	secondary: '#60A5FA',
				// 	dark: '#0F172A',
				// 	'dark-secondary': '#1E293B',
				// 	black: '#000000',
				// 	'gray-dark': '#111827',
				// 	'gray-medium': '#374151',
				// 	'gray-light': '#6B7280',
				// 	accent: '#8B5CF6',
				// 	success: '#10B981',
				// 	warning: '#F59E0B',
				// 	error: '#EF4444',
				// }
			},
			backgroundImage: {
				// New Accent Gradients
				'accent-gradient-light': 'linear-gradient(90deg, #7C3AED, #9333EA)',
				'accent-gradient-dark': 'linear-gradient(90deg, #7C3AED, #6366F1)',
				// Old gradients - comment out or remove
				// 'gradient-primary': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
				// 'gradient-dark': 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
				// 'gradient-card': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 41, 59, 0.1) 100%)',
				// 'gradient-hero': 'linear-gradient(135deg, #000000 0%, #0F172A 50%, #1E293B 100%)',
			},
			boxShadow: {
        'card-light': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)', // Example for soft elevation
      },
			backdropBlur: {
				xs: '2px',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)'
					},
					'50%': {
						boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-up': 'slide-up 0.5s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
