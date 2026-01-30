import type { ImgHTMLAttributes } from "react";

type ImageProps = {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  fill?: boolean;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">;

export default function Image({
  src,
  alt,
  width,
  height,
  priority,
  fill,
  style,
  ...rest
}: ImageProps) {
  const fillStyle = fill
    ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const }
    : {};

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ ...fillStyle, ...style }}
      loading={priority ? "eager" : "lazy"}
      {...rest}
    />
  );
}
