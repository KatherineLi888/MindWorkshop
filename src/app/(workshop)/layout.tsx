import { AppShell } from "@/components/layout/AppShell";
import { WorkshopContent } from "@/components/layout/WorkshopContent";
import { WorkshopThemeProvider } from "@/components/theme/WorkshopThemeProvider";

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkshopThemeProvider>
      <AppShell>
        <WorkshopContent>{children}</WorkshopContent>
      </AppShell>
    </WorkshopThemeProvider>
  );
}
