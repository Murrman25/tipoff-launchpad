import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router-dom";
import type { ReactNode } from "react";

type LinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
} & Omit<RouterLinkProps, "to">;

export default function Link({ href, children, prefetch, ...rest }: LinkProps) {
  // External links
  if (href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a href={href} {...rest} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={href} {...rest}>
      {children}
    </RouterLink>
  );
}
