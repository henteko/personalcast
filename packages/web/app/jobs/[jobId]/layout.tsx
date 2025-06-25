'use client';

import { ConvexClientProvider } from "@/components/ConvexClientProvider";

export default function JobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexClientProvider>
      {children}
    </ConvexClientProvider>
  );
}