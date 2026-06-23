import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#174E8C] text-white shadow-[0_1px_1px_rgba(15,23,42,0.12)] hover:bg-[#255F9F]",
        destructive: "bg-[#EF4444] text-white shadow-sm hover:bg-[#dc2626]",
        outline: "border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm hover:border-[#BBD7EF] hover:bg-[#F8FAFC] hover:text-[#174E8C]",
        secondary: "bg-[#EAF3FB] text-[#174E8C] shadow-sm hover:bg-[#d8eafb]",
        ghost: "text-[#64748B] hover:bg-[#EAF3FB] hover:text-[#174E8C]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-2.5",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-12 px-8",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
