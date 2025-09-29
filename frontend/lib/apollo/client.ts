import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

// GraphQL endpoint URLs - Route through API Gateway
const GRAPHQL_HTTP_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3100/graphql";
const GRAPHQL_WS_URL = process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || "ws://localhost:3100/graphql";

// HTTP Link for queries and mutations
const httpLink = createHttpLink({
  uri: GRAPHQL_HTTP_URL,
  credentials: 'include',
});

// WebSocket Link for subscriptions (only in browser)
const wsLink = typeof window !== "undefined" 
  ? new GraphQLWsLink(
      createClient({
        url: GRAPHQL_WS_URL,
        connectionParams: () => {
          const token = localStorage.getItem("auth_token");
          return {
            authorization: token ? `Bearer ${token}` : "",
          };
        },
        shouldRetry: () => true,
      })
    )
  : null;

// Authentication Link
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage or cookies
  let token = null;
  
  if (typeof window !== "undefined") {
    token = localStorage.getItem("auth_token");
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
});

// Error Link for handling GraphQL and network errors
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `[GraphQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
        
        // Handle specific error types
        if (extensions?.code === "UNAUTHENTICATED") {
          // Redirect to login page
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
            window.location.href = "/auth/signin";
          }
        }
      });
    }

    if (networkError) {
      console.error(`[Network Error]: ${networkError}`);
      
      // Handle authentication errors
      if (networkError.statusCode === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          window.location.href = "/auth/signin";
        }
      }
    }
  }
);

// Split link to route queries/mutations to HTTP and subscriptions to WebSocket
const splitLink = typeof window !== "undefined" && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      from([errorLink, authLink, httpLink])
    )
  : from([errorLink, authLink, httpLink]);

// Apollo Client configuration
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          doctors: {
            keyArgs: ["search", "departmentId", "specialization"],
            merge(existing, incoming, { args }) {
              if (!args?.offset || args.offset === 0) {
                return incoming;
              }
              
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...(incoming?.edges || [])],
              };
            },
          },
          patients: {
            keyArgs: ["search"],
            merge(existing, incoming, { args }) {
              if (!args?.offset || args.offset === 0) {
                return incoming;
              }
              
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...(incoming?.edges || [])],
              };
            },
          },
          appointments: {
            keyArgs: ["doctorId", "patientId", "status", "dateFrom", "dateTo"],
            merge(existing, incoming, { args }) {
              if (!args?.offset || args.offset === 0) {
                return incoming;
              }
              
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...(incoming?.edges || [])],
              };
            },
          },
        },
      },
      Doctor: {
        fields: {
          appointments: {
            merge(existing = { edges: [] }, incoming) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
          reviews: {
            merge(existing = { edges: [] }, incoming) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
        },
      },
      Patient: {
        fields: {
          appointments: {
            merge(existing = { edges: [] }, incoming) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
          medicalRecords: {
            merge(existing = { edges: [] }, incoming) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      fetchPolicy: "cache-and-network",
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "cache-first",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
  connectToDevTools: process.env.NODE_ENV === "development",
});

// Helper function to clear cache
export const clearApolloCache = () => {
  apolloClient.clearStore();
};

// Helper function to refetch all active queries
export const refetchActiveQueries = () => {
  apolloClient.refetchQueries({
    include: "active",
  });
};
