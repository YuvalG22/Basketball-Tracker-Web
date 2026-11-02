import MinutesProvider from "./timing/MinutesProvider";
import PreferencesProvider from "./preferences/PreferencesProvider";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";
import { historicalQueryOptions } from "./api/queryOptions";

const queryClient = new QueryClient({
  defaultOptions: { queries: historicalQueryOptions },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PreferencesProvider><MinutesProvider><App /></MinutesProvider></PreferencesProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
