import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container-px max-w-5xl mx-auto py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded bg-blue-600 text-white flex items-center justify-center font-bold">F</div>
          <span className="font-semibold text-gray-900">BlueHope Fund</span>
        </Link>
        <p className="hidden sm:block text-sm text-gray-600">
          작은 기부가 큰 변화를 만듭니다.
        </p>
      </div>
    </header>
  )
}