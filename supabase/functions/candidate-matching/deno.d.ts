// Deno global types for TypeScript
// This file allows TypeScript to recognize Deno APIs

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };

  export function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
}

// Declare Deno as global variable
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

