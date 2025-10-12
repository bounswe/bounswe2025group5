import { useEffect, useState } from "react";
import { PostsApi } from "@/lib/api/posts";
import { LikesApi } from "@/lib/api/likes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Post = Awaited<ReturnType<typeof PostsApi.list>>[number];

export default function DemoPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await PostsApi.list({ size: 5 });
        setPosts(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const like = async (postId: number) => {
    try {
      await LikesApi.add({ username: "demo", postId });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {loading && <p className="text-white/80">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && posts.map((p) => (
        <Card key={p.postId}>
          <CardHeader>
            <CardTitle>{p.username}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90 mb-2">{p.content}</p>
            <Button size="sm" onClick={() => like(p.postId)}>Like</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


