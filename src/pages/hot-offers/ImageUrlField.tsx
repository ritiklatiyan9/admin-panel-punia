import { useRef, useState } from "react";
import {
  ArrowUpTrayIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hotOffersService } from "@/services/hot-offers.service";
import { apiErrorMessage } from "@/services/api-client";
import { cn } from "@/utils/cn";

interface ImageUrlFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /** Where this image shows up in the app, so admins never have to guess. */
  hint?: string;
}

/** Thumbnail + URL input + upload button — uploads go to the backend and fill the URL. */
export const ImageUrlField = ({
  label,
  value,
  onChange,
  placeholder = "https://…",
  hint,
}: ImageUrlFieldProps): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState<string | null>(null);

  const upload = async (file: File): Promise<void> => {
    setUploading(true);
    try {
      onChange(await hotOffersService.uploadImage(file));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const showImage = value.trim() !== "" && broken !== value;

  return (
    <div className="flex gap-3">
      <div className="flex h-[72px] w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/60">
        {showImage ? (
          <img
            src={value}
            alt=""
            className="h-full w-full object-contain"
            onError={() => setBroken(value)}
          />
        ) : (
          <PhotoIcon className="h-6 w-6 text-muted-foreground/60" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
          />
          {value && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => onChange("")}
              title="Clear"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            title="Upload image"
          >
            <ArrowUpTrayIcon
              className={cn("h-4 w-4", uploading && "animate-pulse")}
            />
          </Button>
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
};
