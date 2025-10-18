import { Button } from "@/components/ui/button";

export default function DemoIndex() {
  return (
    <div className="space-y-4 text-white">
      <h1 className="text-2xl font-bold">Demo Pages</h1>
      <div className="flex gap-3">
        <a href="/demo/users"><Button variant="outline">Users</Button></a>
        <a href="/demo/posts"><Button variant="outline">Posts</Button></a>
      </div>
    </div>
  );
}


