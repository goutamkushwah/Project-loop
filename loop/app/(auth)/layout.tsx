import type { ReactNode } from "react";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen outline-none">
      {children}
    </div>
  );
}