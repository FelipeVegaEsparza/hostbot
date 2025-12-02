declare namespace JSX {
  interface IntrinsicElements {
    'chatbot-widget': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'bot-id'?: string;
        'api-url'?: string;
        theme?: string;
        position?: string;
        'primary-color'?: string;
        'welcome-message'?: string;
        placeholder?: string;
      },
      HTMLElement
    >;
  }
}
