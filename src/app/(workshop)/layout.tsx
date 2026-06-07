import { AppShell } from "@/components/layout/AppShell";
import { WorkshopThemeProvider } from "@/components/theme/WorkshopThemeProvider";

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkshopThemeProvider>
      <AppShell>{children}</AppShell>
    </WorkshopThemeProvider>
  );
}
