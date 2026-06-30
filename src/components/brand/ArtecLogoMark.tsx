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
      <path
        d="M15.5 48L32.5 17"
        stroke="currentColor"
        strokeWidth="8.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36.5 18.5L47 40"
        stroke="var(--logo-accent, currentColor)"
        strokeWidth="8.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37.5 48H51.5"
        stroke="currentColor"
        strokeWidth="8.75"
        strokeLinecap="round"
      />
      <path
        d="M30.8 36H43.5"
        stroke="var(--logo-accent, currentColor)"
        strokeWidth="7.75"
        strokeLinecap="round"
      />
      <path
        d="M31 48H39"
        stroke="currentColor"
        strokeWidth="8.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
