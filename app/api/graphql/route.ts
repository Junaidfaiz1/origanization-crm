import type { NextRequest } from "next/server";
import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";
import { createContext } from "@/lib/graphql/context";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response, Request, Headers },
  context: async ({ request }) => createContext(request),
});

export function GET(request: NextRequest) {
  return yoga.fetch(request);
}

export function POST(request: NextRequest) {
  return yoga.fetch(request);
}

export function OPTIONS(request: NextRequest) {
  return yoga.fetch(request);
}
