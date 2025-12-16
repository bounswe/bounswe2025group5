import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import imageFallback from '@/assets/image-fallback.png';

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  altText: string;
  username?: string;
}

export default function ImageDialog({
  open,
  onOpenChange,
  imageUrl,
  altText,
  username,
}: ImageDialogProps) {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState(imageUrl);

  useEffect(() => {
    setImageSrc(imageUrl);
  }, [imageUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 overflow-hidden"
        style={{
          minWidth: '55vw',
          maxWidth: '90vw',
          minHeight: '50vh',
          maxHeight: '75vh',
          width: 'fit-content'
        }}
      >
        <DialogHeader className="absolute top-0 right-0 z-10 p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="bg-black/50 hover:bg-destructive text-white rounded-full"
            aria-label={t('post.closeImage', 'Close image')}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <DialogTitle className="sr-only">
          {username
            ? t('post.imageDialogTitle', {
                username,
                defaultValue: `${username}'s post image`,
              })
            : t('post.imageDialogTitleGeneric', { defaultValue: 'Post image' })}
        </DialogTitle>
        <div className="flex items-center justify-center w-full h-full bg-[#1b1b1a] backdrop-blur-md">
          <img
            src={imageSrc}
            onError={() => setImageSrc(imageFallback)}
            alt={altText}
            className="max-w-[85vw] max-h-[75vh] object-contain"
            style={{
              minWidth: 'min(400px, 85vw)',
              minHeight: 'min(400px, 75vh)',
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
