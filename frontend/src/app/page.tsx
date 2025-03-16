import { AppShell } from '@/components/layout/AppShell';
import { Welcome } from '@/components/Welcome';

export default function HomePage() {
  return (
    <AppShell>
      <Welcome />
    </AppShell>
  );
}
