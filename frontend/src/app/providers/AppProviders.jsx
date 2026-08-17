import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "../../shared/lib/queryClient.js";
import ToastContainer from "../../shared/components/Toast.jsx";

export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
