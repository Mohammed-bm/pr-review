export default function AuthLayout({ 
  title, 
  subtitle, 
  children 
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-300">{subtitle}</p>
        </div>
        
        {children}
      </div>
    </main>
  );
}