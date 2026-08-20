import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FotoAmpliavel({
  src,
  alt,
  legenda,
  className = "max-h-64",
}: {
  src: string;
  alt: string;
  legenda?: string;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative w-full overflow-hidden rounded-lg border border-border bg-background"
          aria-label={`Ampliar foto: ${alt}`}
        >
          <img src={src} alt={alt} className={`w-full object-contain ${className}`} />
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm">
            <Maximize2 className="size-3.5" /> Ampliar
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{alt}</DialogTitle>
          {legenda ? <DialogDescription>{legenda}</DialogDescription> : null}
        </DialogHeader>
        <img
          src={src}
          alt={alt}
          className="max-h-[70vh] w-full rounded-lg bg-muted object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
