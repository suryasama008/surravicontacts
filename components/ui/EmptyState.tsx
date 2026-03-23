export default function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M13.5 13.5l4 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <p className="text-sm font-medium text-gray-600">{message}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
