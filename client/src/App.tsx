import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./client";
import { useState } from "react";
import { createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import superjson from "superjson";
import Liveticker from "./Liveticker";

function App() {
  let host = window.location.host;
  if (host.includes("localhost")) host = "localhost:3000";

  const [queryClient] = useState(() => new QueryClient());
  const [wsClient] = useState(() =>
    // make this relative to the current page
    createWSClient({
      url: `ws${window.location.protocol === "http:" ? "" : "s"}://${host}/trpc`,
    })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: wsLink({ client: wsClient }),
          false: httpBatchLink({
            url: `${window.location.protocol}//${host}/trpc`,
          }),
        }),
      ],
      transformer: superjson,
    })
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Liveticker />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
