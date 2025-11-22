import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 overflow-hidden"
        style={{
          minWidth: '60vw',
          maxWidth: '85vw',
          minHeight: '65vh',
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
            src={imageUrl}
            alt={altText}
            className="w-auto h-auto min-w-[60vw] min-h-[65vh] max-w-[85vw] max-h-[75vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
