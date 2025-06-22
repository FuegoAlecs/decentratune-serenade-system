/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
