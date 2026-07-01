import type { SVGProps } from "react";

export function ArtecLogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <rect width="64" height="64" rx="18" fill="currentColor" opacity="0.12" />
      <path
        d="M18 43.4c0-1.55 1.25-2.8 2.8-2.8h22.4a2.8 2.8 0 0 1 0 5.6H20.8a2.8 2.8 0 0 1-2.8-2.8Z"
        fill="currentColor"
      />
      <path
        d="M18 32c0-1.55 1.25-2.8 2.8-2.8h14.4a2.8 2.8 0 0 1 0 5.6H20.8A2.8 2.8 0 0 1 18 32Z"
        fill="var(--logo-accent, currentColor)"
      />
      <path
        d="M18 20.6c0-1.55 1.25-2.8 2.8-2.8h22.4a2.8 2.8 0 0 1 0 5.6H20.8a2.8 2.8 0 0 1-2.8-2.8Z"
        fill="var(--logo-accent, currentColor)"
      />
      <path
        d="M40.4 32a5.6 5.6 0 1 1 11.2 0 5.6 5.6 0 0 1-11.2 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
