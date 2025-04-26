export function Button({ children, onClick, type = "button", className = "" }) {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`px-6 py-3 rounded-2xl shadow-md bg-blue-600 text-white font-semibold hover:bg-blue-700 ${className}`}
      >
        {children}
      </button>
    );
  }
  