import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./client";
import { useState } from "react";
import { createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import superjson from "superjson";
import Liveticker from "./Liveticker";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [wsClient] = useState(() =>
    createWSClient({ url: `ws://localhost:3000/trpc` })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: wsLink({ client: wsClient }),
          false: httpBatchLink({ url: `http://localhost:3000/trpc` }),
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
