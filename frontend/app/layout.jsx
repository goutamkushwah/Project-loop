import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "LOOP — Customer Feedback Intelligence",
  description: "Close the loop on every customer voice.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
