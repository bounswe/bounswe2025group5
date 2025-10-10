import AppShell from "../components/AppShell";
import { Button } from "../components/ui/button";

export default function Index() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Wasteless</h1>
        <p className="text-muted-foreground">Build your sustainability app UI with shadcn.</p>
        <div className="flex gap-2">
          <a href="/login"><Button variant="outline">Sign in</Button></a>
          <a href="/register"><Button>Get started</Button></a>
        </div>
      </div>
    </AppShell>
  );
}
