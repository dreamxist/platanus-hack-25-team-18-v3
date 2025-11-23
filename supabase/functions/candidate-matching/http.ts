export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const availableEndpoints = {
  root: "GET /",
  topics: "GET /topics",
  create_user: "POST /users",
  user_operations: "GET/POST /users/{user_id}/...",
};

type RouteNotFoundPayload = {
  path: string;
  method: string;
};

export function createRouteNotFoundResponse({
  path,
  method,
}: RouteNotFoundPayload): Response {
  return jsonResponse(
    {
      error: "Not found",
      path,
      method,
      available_endpoints: availableEndpoints,
    },
    404
  );
}

