import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { Edit, Image } from 'lucide-react';
import { PostsApi } from '@/lib/api/posts';
import type { PostItem } from '@/lib/api/schemas/posts';

interface EditPostDialogProps {
  post: PostItem;
  onPostUpdated: (updatedPost: PostItem) => void;
  currentUsername: string;
}

export default function EditPostDialog({ post, onPostUpdated, currentUsername }: EditPostDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [postData, setPostData] = useState({
    content: post.content || '',
    photoFile: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedPostResponse = await PostsApi.edit(post.postId, {
        content: postData.content,
        username: currentUsername,
        photoFile: postData.photoFile || undefined,
      });
      
      // Use the updated post from the API response
      const updatedPost: PostItem = {
        ...post,
        ...updatedPostResponse,
      };
      
      onPostUpdated(updatedPost);
      setIsOpen(false);
      
      // Reset form
      setPostData({
        content: post.content || '',
        photoFile: null,
      });
    } catch (error) {
      console.error('Error updating post:', error);
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

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setPostData({
        content: post.content || '',
        photoFile: null,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-blue-50 hover:text-blue-600 transition-colors h-8 w-8"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('post.edit.title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Content */}
          <div className="space-y-2">
            <Label htmlFor="edit-content">{t('feed.createPost.content.label')}</Label>
            <Textarea
              id="edit-content"
              placeholder={t('feed.createPost.content.placeholder')}
              value={postData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setPostData(prev => ({ ...prev, content: e.target.value }))
              }
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          {/* Current Image Info */}
          {post.photoUrl && (
            <div className="text-sm text-muted-foreground">
              {t('post.edit.currentImage')}
            </div>
          )}

          {/* New Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="edit-image" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              {t('post.edit.newImage')}
            </Label>
            <Input
              id="edit-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
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
              className="flex-1"
            >
              {isLoading ? t('post.edit.saving') : t('post.edit.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}