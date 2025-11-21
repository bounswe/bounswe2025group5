import { http, HttpResponse } from 'msw';
import type { PostItem } from '@/lib/api/schemas/posts';

// Mock post data
export const mockPosts: PostItem[] = [
  {
    postId: 1,
    content: 'First test post about recycling',
    createdAt: '2025-01-15T10:00:00Z',
    creatorUsername: 'testuser',
    photoUrl: null,
    likes: 5,
    comments: 2,
    liked: false,
    saved: false,
  },
  {
    postId: 2,
    content: 'Second post with image',
    createdAt: '2025-01-15T11:00:00Z',
    creatorUsername: 'anotheruser',
    photoUrl: 'https://example.com/image.jpg',
    likes: 10,
    comments: 3,
    liked: true,
    saved: true,
  },
  {
    postId: 3,
    content: 'Third popular post',
    createdAt: '2025-01-15T12:00:00Z',
    creatorUsername: 'popularuser',
    photoUrl: null,
    likes: 25,
    comments: 8,
    liked: false,
    saved: false,
  },
];

export const postHandlers = [
  // List posts
  http.get('/api/posts', ({ request }) => {
    const url = new URL(request.url);
    const size = parseInt(url.searchParams.get('size') || '10');
    const lastPostId = url.searchParams.get('lastPostId');
    
    if (lastPostId) {
      // Return empty array for pagination
      return HttpResponse.json([]);
    }
    
    return HttpResponse.json(mockPosts.slice(0, size));
  }),

  // List most liked posts
  http.get('/api/posts/mostLiked', ({ request }) => {
    const url = new URL(request.url);
    const size = parseInt(url.searchParams.get('size') || '10');
    
    const sortedPosts = [...mockPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return HttpResponse.json(sortedPosts.slice(0, size));
  }),

  // Create post
  http.post('/api/posts', async ({ request }) => {
    const formData = await request.formData();
    const content = formData.get('content') as string;
    const username = formData.get('username') as string;
    
    const newPost: PostItem = {
      postId: 999,
      content,
      createdAt: new Date().toISOString(),
      creatorUsername: username,
      photoUrl: null,
      likes: 0,
      comments: 0,
      liked: false,
      saved: false,
    };
    
    return HttpResponse.json(newPost, { status: 201 });
  }),

  // Edit post
  http.put('/api/posts/:postId', async ({ params, request }) => {
    const postId = parseInt(params.postId as string);
    const formData = await request.formData();
    const content = formData.get('content') as string;
    
    const post = mockPosts.find(p => p.postId === postId);
    if (!post) {
      return HttpResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const updatedPost = { ...post, content };
    return HttpResponse.json(updatedPost);
  }),

  // Delete post
  http.delete('/api/posts/:postId', ({ params }) => {
    const postId = parseInt(params.postId as string);
    return HttpResponse.json({ postId }, { status: 200 });
  }),

  // Save post
  http.post('/api/posts/:postId/save', ({ params }) => {
    const postId = parseInt(params.postId as string);
    return HttpResponse.json({ postId }, { status: 200 });
  }),

  // Unsave post
  http.delete('/api/posts/:postId/save/:username', ({ params }) => {
    const postId = parseInt(params.postId as string);
    return HttpResponse.json({ postId }, { status: 200 });
  }),

  // Add like
  http.post('/api/likes', async ({ request }) => {
    const body = await request.json() as { username: string; postId: number };
    return HttpResponse.json({ postId: body.postId }, { status: 200 });
  }),

  // Remove like
  http.delete('/api/likes', async ({ request }) => {
    const body = await request.json() as { username: string; postId: number };
    return HttpResponse.json({ postId: body.postId }, { status: 200 });
  }),

  // Search posts
  http.post('/api/search/semantic/posts', async ({ request }) => {
    const body = await request.json() as { query: string };
    
    // Return filtered posts based on query
    const filtered = mockPosts.filter(p => 
      p.content.toLowerCase().includes(body.query.toLowerCase())
    );
    
    return HttpResponse.json(filtered);
  }),

  // Comments list
  http.get('/api/posts/:postId/comments', () => {
    return HttpResponse.json({ comments: [] });
  }),
];
