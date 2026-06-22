import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#174E8C] text-white shadow-[0_1px_1px_rgba(15,23,42,0.12),0_8px_18px_-12px_rgba(23,78,140,0.75)] hover:-translate-y-px hover:bg-[#255F9F] hover:shadow-[0_10px_22px_-14px_rgba(23,78,140,0.8)] active:translate-y-0",
        destructive: "bg-[#EF4444] text-white shadow-sm hover:bg-[#dc2626]",
        outline: "border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm hover:border-[#BBD7EF] hover:bg-[#F8FAFC] hover:text-[#174E8C]",
        secondary: "bg-[#EAF3FB] text-[#174E8C] shadow-sm hover:bg-[#d8eafb]",
        ghost: "text-[#64748B] hover:bg-[#EAF3FB] hover:text-[#174E8C]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
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
