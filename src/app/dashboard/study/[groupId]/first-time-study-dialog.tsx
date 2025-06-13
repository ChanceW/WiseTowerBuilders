import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart } from "lucide-react";

interface FirstTimeStudyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bibleBook: string;
  bibleChapter: number;
}

export function FirstTimeStudyDialog({
  open,
  onOpenChange,
  bibleBook,
  bibleChapter,
}: FirstTimeStudyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--paper)] border-[var(--muted)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--foreground)]">
            Welcome to Your Study!
          </DialogTitle>
          <DialogDescription className="text-[var(--foreground)]/80">
            Before you begin, we have a few encouragements for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-[var(--deep-golden)] mt-1" />
            <div className="space-y-2">
              <h3 className="font-semibold text-[var(--foreground)]">Use Your Physical Bible</h3>
              <p className="text-sm text-[var(--foreground)]/80">
                While we provide a digital link to {bibleBook} {bibleChapter}, we encourage you to use your physical Bible. 
                There's something special about holding God's Word in your hands and making notes in the margins.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Heart className="h-6 w-6 text-[var(--deep-golden)] mt-1" />
            <div className="space-y-2">
              <h3 className="font-semibold text-[var(--foreground)]">Start with Prayer</h3>
              <p className="text-sm text-[var(--foreground)]/80">
                Take a moment to pray before beginning your study. Ask God to open your heart and mind to understand His Word 
                and to guide your discussion with others.
              </p>
            </div>
          </div>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-white"
          >
            Begin Study
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 