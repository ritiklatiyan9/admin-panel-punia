import { useState, type ImgHTMLAttributes } from "react";
import { mediaUrl } from "@/utils/media-url";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  size?: 160 | 640;
};

/** Small managed previews with a full-image fallback during rolling deployments. */
export const OptimizedImage = ({
  src,
  size = 640,
  onError,
  ...props
}: Props): JSX.Element => {
  const thumbnail = mediaUrl(src, size);
  const original = mediaUrl(src);
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <img
      loading="lazy"
      decoding="async"
      {...props}
      src={failed === thumbnail ? original : thumbnail}
      onError={(event) => {
        if (failed !== thumbnail && thumbnail !== original)
          setFailed(thumbnail);
        else onError?.(event);
      }}
    />
  );
};
