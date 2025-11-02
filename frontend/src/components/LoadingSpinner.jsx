export default function LoadingSpinner({ size = 'default' }) {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    default: 'w-12 h-12 border-3',
    large: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`spinner ${sizeClasses[size]}`}></div>
    </div>
  );
}
