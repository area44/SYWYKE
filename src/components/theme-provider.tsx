"use client";

import * as React from "react";

export function ThemeProvider({
  children,
  ...props
}: { children: React.ReactNode } & any) {
  return <>{children}</>;
}
