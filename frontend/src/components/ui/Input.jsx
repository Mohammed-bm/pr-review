export default function Input({ 
  label, 
  type = "text", 
  error,
  className = "",
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
          text-white placeholder-gray-400 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          transition duration-200
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}