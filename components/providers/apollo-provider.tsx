"use client";

import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { useMemo, type ReactNode } from "react";

export function AppApolloProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      new ApolloClient({
        link: new HttpLink({
          uri: "/api/graphql",
          credentials: "same-origin",
        }),
        cache: new InMemoryCache(),
      }),
    [],
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
