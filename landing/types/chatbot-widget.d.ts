/**
 * Type declarations for chatbot-widget custom element
 */

declare namespace JSX {
  interface IntrinsicElements {
    'chatbot-widget': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'bot-id'?: string;
        'api-url'?: string;
        'theme'?: 'light' | 'dark';
        'position'?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
        'primary-color'?: string;
        'welcome-message'?: string;
        'placeholder'?: string;
      },
      HTMLElement
    >;
  }
}
