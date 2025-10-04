export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700 ${className}`}>
      {children}
    </div>
  );
}