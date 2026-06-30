import type { SVGProps } from "react";

export function ArtecLogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M47.98 12C51.24 12 54.22 13.82 55.72 16.72L84.78 73.02C87.66 78.6 83.62 85.2 77.34 85.2H67.58C64.42 85.2 61.52 83.42 60.1 80.6L47.98 56.52L35.86 80.6C34.44 83.42 31.54 85.2 28.38 85.2H18.62C12.34 85.2 8.3 78.6 11.18 73.02L40.24 16.72C41.74 13.82 44.72 12 47.98 12Z"
        fill="currentColor"
      />
      <path
        d="M36.7 55.1H59.3C61.62 55.1 63.12 52.64 62.06 50.58L51.34 29.76C49.92 27 46.04 27 44.62 29.76L33.94 50.58C32.88 52.64 34.38 55.1 36.7 55.1Z"
        fill="var(--logo-cutout, #061A3A)"
      />
      <path
        d="M44.6 62.6H51.38C53.14 62.6 54.72 63.58 55.5 65.16L61.02 76.2H34.96L40.48 65.16C41.26 63.58 42.84 62.6 44.6 62.6Z"
        fill="var(--logo-cutout, #061A3A)"
      />
    </svg>
  );
}
