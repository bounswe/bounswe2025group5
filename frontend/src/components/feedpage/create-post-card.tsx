import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useTranslation } from 'react-i18next';
import { Plus, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostsApi } from '@/lib/api/posts';

interface CreatePostCardProps {
  onPostCreated?: () => void;
  className?: string;
}

export default function CreatePostCard({ onPostCreated, className }: CreatePostCardProps) {
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

      await PostsApi.create({
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
      onPostCreated?.();
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
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900">{t('feed.createPost.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('feed.createPost.subtitle')}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-muted-foreground hover:text-foreground transition-colors duration-200 h-10 px-4 py-2 transform-none scale-100 hover:scale-100"
            >
              <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{t('feed.createPost.placeholder')}</span>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-96 p-0 shadow-lg" align="start">
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
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
                  className="flex-1"
                >
                  {isLoading ? t('common.posting') : t('feed.createPost.submit')}
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}