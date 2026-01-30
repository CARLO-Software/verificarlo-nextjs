import { ReactNode } from "react";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      {children}
    </main>
  );
}
