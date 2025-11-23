export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  return new Response(
    JSON.stringify({
      error: "Not found",
      path,
      method,
      available_endpoints: availableEndpoints,
    }),
    {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

