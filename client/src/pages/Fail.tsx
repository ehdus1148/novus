import { Link, useLocation } from 'react-router-dom'

export default function Fail() {
  const query = new URLSearchParams(useLocation().search)
  const provider = query.get('provider')
  const reason = query.get('message') || '결제가 완료되지 않았습니다.'
  return (
    <div className="max-w-xl mx-auto text-center bg-white border rounded-xl p-6">
      <h1 className="text-2xl font-bold text-gray-900">결제 실패</h1>
      <p className="mt-2 text-gray-700">{provider ? `${provider} 결제 중 오류` : '오류가 발생했습니다.'}</p>
      <p className="mt-1 text-gray-500">{reason}</p>
      <div className="mt-6">
        <Link to="/" className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">다시 시도하기</Link>
      </div>
    </div>
  )
}