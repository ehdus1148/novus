import { useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { api } from '../api'
import { formatKRW } from '../utils/currency'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function ThankYou() {
  const qs = useQuery()
  const provider = qs.get('provider')
  const orderId = qs.get('orderId') || ''
  const amountParam = qs.get('amount')
  const [name, setName] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [amount, setAmount] = useState<number>(Number(amountParam || 0))
  const [saved, setSaved] = useState<boolean>(false)

  useEffect(() => {
    // If return from Toss, retrieve stored donor info, amount from URL param 'amount' may not be available
    if (provider === 'toss' && orderId) {
      const raw = sessionStorage.getItem(`donation:${orderId}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        setName(parsed.name)
        setMessage(parsed.message)
        setAmount(parsed.amount)
        sessionStorage.removeItem(`donation:${orderId}`)
      }
    } else {
      // For Kakao, name/message/amount should be present as query params (set by backend redirect)
      const n = qs.get('name') || ''
      const m = qs.get('message') || ''
      const a = Number(qs.get('amount') || 0)
      setName(n)
      setMessage(m)
      if (!amountParam) setAmount(a)
    }
  }, [provider, orderId, amountParam, qs])

  useEffect(() => {
    // Persist the donation to our backend for listing and metrics
    async function persist() {
      if (!provider || !orderId || !name || !amount) return
      try {
        await api.post('/donations', {
          orderId,
          name,
          message,
          amount,
          provider,
        })
        setSaved(true)
      } catch (err) {
        console.error(err)
      }
    }
    persist()
  }, [provider, orderId, name, message, amount])

  return (
    <div className="max-w-xl mx-auto text-center bg-white border rounded-xl p-6">
      <h1 className="text-2xl font-bold text-gray-900">감사합니다!</h1>
      <p className="mt-2 text-gray-700">
        {name}님, 소중한 기부에 진심으로 감사드립니다.
      </p>
      <p className="mt-1 text-blue-700">{formatKRW(amount)}</p>
      {message && <p className="mt-2 text-gray-600">“{message}”</p>}
      <p className="mt-4 text-sm text-gray-500">{saved ? '기부 내역이 반영되었습니다.' : '기부 내역을 반영하는 중입니다...'}</p>
      <div className="mt-6">
        <Link to="/" className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">홈으로 돌아가기</Link>
      </div>
    </div>
  )
}