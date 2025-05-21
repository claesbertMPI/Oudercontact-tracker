import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper"; // gebruik alias '@' → staat goed door jouw install

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
