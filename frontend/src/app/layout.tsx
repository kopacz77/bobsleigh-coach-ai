import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthProvider } from "@/providers/AuthProvider";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { theme } from "@/styles/theme";

export const metadata = {
  title: "Bobsleigh Coach AI",
  description: "AI-powered training application for bobsleigh athletes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            <MantineProvider theme={theme} defaultColorScheme="auto">
              <Notifications position="top-right" />
              <AuthGuard>{children}</AuthGuard>
            </MantineProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
