const styles: Record<string, string> = {
  manufacturer: 'bg-teal-100 text-teal-800',
  importer: 'bg-amber-100 text-amber-800',
  exporter: 'bg-rose-100 text-rose-800',
  distributor: 'bg-blue-100 text-blue-800',
  default: 'bg-gray-100 text-gray-700',
}

export default function Badge({ label }: { label: string }) {
  const style = styles[label.toLowerCase()] || styles.default
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {label}
    </span>
  )
}
