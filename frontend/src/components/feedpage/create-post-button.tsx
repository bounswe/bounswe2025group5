import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useTranslation } from 'react-i18next';
import { Image } from 'lucide-react';
import { PostsApi } from '@/lib/api/posts';
import type { PostItem } from '@/lib/api/schemas/posts';

interface CreatePostButtonProps {
  onPostCreated?: (newPost: PostItem) => void;
  className?: string;
}

export default function CreatePostButton({ onPostCreated, className }: CreatePostButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [postData, setPostData] = useState({
    content: '',
    photoFile: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const username = localStorage.getItem('username');
      if (!username) {
        throw new Error('Username not found');
      }

      const newPost = await PostsApi.create({
        content: postData.content,
        username,
        photoFile: postData.photoFile || undefined,
      });
      
      // Reset form
      setPostData({
        content: '',
        photoFile: null,
      });
      
      setIsOpen(false);
      onPostCreated?.(newPost);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostData(prev => ({ ...prev, photoFile: file }));
    }
  };

  return (
    <div className="flex justify-center">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="tertiary" className={className}>
            {t('feed.createPost.placeholder')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('feed.createPost.title')}</DialogTitle>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4" aria-label={t('feed.createPost.title')}>
              {/* Kindness Reminder */}
              <div className="bg-tertiary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm text-tertiary font-medium">
                  {t('kindnessReminder.message')}
                </p>
              </div>

              {/* Post Content */}
              <div className="space-y-2">
                <Label htmlFor="post-content">{t('feed.createPost.content.label')}</Label>
                <Textarea
                  id="post-content"
                  placeholder={t('feed.createPost.content.placeholder')}
                  value={postData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[100px] resize-none animate-input"
                  required
                  aria-required="true"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="post-image" className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  {t('feed.createPost.image.label')}
                </Label>
                <Input
                  id="post-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="animate-input cursor-pointer"
                />
                {postData.photoFile && (
                  <p className="text-sm text-emerald-600">
                    {t('feed.createPost.image.selected')}: {postData.photoFile.name}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !postData.content.trim()}
                  aria-busy={isLoading}
                  aria-disabled={isLoading || !postData.content.trim()}
                  className="flex-1"
                >
                  {isLoading ? t('common.posting') : t('feed.createPost.submit')}
                </Button>
              </div>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
