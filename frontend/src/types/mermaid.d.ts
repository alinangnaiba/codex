declare module 'mermaid' {
  export interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: string;
    securityLevel?: string;
    htmlLabels?: boolean;
    deterministicIds?: boolean;
    fontFamily?: string;
    fontSize?: number;
    flowchart?: {
      useMaxWidth?: boolean;
      htmlLabels?: boolean;
    };
    sequence?: {
      useMaxWidth?: boolean;
      wrap?: boolean;
    };
    gantt?: {
      useMaxWidth?: boolean;
    };
    journey?: {
      useMaxWidth?: boolean;
    };
    gitgraph?: {
      useMaxWidth?: boolean;
    };
  }

  export interface RenderResult {
    svg: string;
  }

  const mermaid: {
    initialize: (config: MermaidConfig) => void;
    render: (id: string, definition: string) => Promise<RenderResult>;
  };

  export default mermaid;
}