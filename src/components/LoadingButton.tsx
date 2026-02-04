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
      className={`flex w-full justify-center items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-white" />}
      {children}
    </button>
  );
}

export default LoadingButton;
