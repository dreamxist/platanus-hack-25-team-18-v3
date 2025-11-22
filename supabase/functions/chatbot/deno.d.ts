// Tipos globales de Deno para TypeScript
// Este archivo permite que TypeScript reconozca las APIs de Deno

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };

  export function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
}

// Declarar Deno como variable global
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

// Permitir imports de URLs (necesario para Deno)
declare module "https://*" {
  const content: any;
  export default content;
}

declare module "https://esm.sh/*" {
  const content: any;
  export default content;
}

// Asegurar que console, Request, Response están disponibles
// (ya están en lib: ["esnext", "dom"])
