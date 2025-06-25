'use client';

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      console.warn("NEXT_PUBLIC_CONVEX_URL is not set");
      // ダミーのURLを使用（ビルド時のみ）
      return new ConvexReactClient("https://dummy.convex.cloud");
    }
    return new ConvexReactClient(url);
  }, []);
  
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}