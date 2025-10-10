import { Button } from "../components/ui/button";


export default function Index() {
  return (
    <div className="space-y-5 text-white">
      <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">Welcome to Wasteless</h1>
      <p className="max-w-prose text-white/85">Build your sustainability app with a clean, accessible, high-contrast UI powered by shadcn.</p>
      <div className="flex gap-3">
        <a href="/auth/login"><Button variant="outline" className="border-white/40 text-white hover:bg-white/10">Sign in</Button></a>
        <a href="/register"><Button className="bg-white text-black hover:bg-white/90">Get started</Button></a>
      </div>
    </div>
  );
}
