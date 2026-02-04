import { Spinner } from "./Spinner";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={`flex w-full justify-center items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-white" />}
      {children}
    </button>
  );
}

export default LoadingButton;
