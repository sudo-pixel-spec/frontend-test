"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import React from "react";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 2800 }} />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}