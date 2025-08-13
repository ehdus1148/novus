type Props = {
  value: number // 0-100
}

export default function ProgressBar({ value }: Props) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className="h-3 bg-blue-600 transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        role="progressbar"
      />
    </div>
  )
}