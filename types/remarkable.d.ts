declare module 'remarkable' {
  interface RemarkableOptions {
    html?: boolean;
    xhtmlOut?: boolean;
    breaks?: boolean;
    langPrefix?: string;
    linkify?: boolean;
    typographer?: boolean;
    quotes?: string;
    highlight?: (str: string, lang: string) => string;
  }

  class Remarkable {
    constructor(preset?: string, options?: RemarkableOptions);
    constructor(options?: RemarkableOptions);
    render(text: string, env?: unknown): string;
    set(options: RemarkableOptions): void;
    use(plugin: (md: Remarkable, options?: unknown) => void, options?: unknown): this;
  }

  export { Remarkable };
}
