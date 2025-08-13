import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { loadTossPayments } from '@tosspayments/payment-sdk'

// Preset donation amounts in KRW
const PRESET_AMOUNTS = [10000, 50000, 100000]

type Props = {
  open: boolean
  onClose: () => void
}

export default function DonateModal({ open, onClose }: Props) {
  const [amount, setAmount] = useState<number>(10000)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (!open) {
      setAmount(10000)
      setCustomAmount('')
      setName('')
      setMessage('')
      setIsSubmitting(false)
    }
  }, [open])

  const finalAmount = useMemo(() => {
    if (customAmount) return Number(customAmount)
    return amount
  }, [amount, customAmount])

  if (!open) return null

  // Simple unique id for the donation attempt
  const orderId = useMemo(() => `order_${Date.now()}`, [])

  async function handleTossPayment() {
    if (!finalAmount || !name) return
    setIsSubmitting(true)
    try {
      // Store donor input locally so we can retrieve it after redirect
      sessionStorage.setItem(
        `donation:${orderId}`,
        JSON.stringify({ name, message, amount: finalAmount })
      )

      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string
      if (!clientKey) {
        alert('Missing VITE_TOSS_CLIENT_KEY in your environment')
        setIsSubmitting(false)
        return
      }

      // Using Toss Payments JavaScript SDK (test mode via test client key)
      const tossPayments = await loadTossPayments(clientKey)
      await tossPayments.requestPayment('카드', {
        amount: finalAmount,
        orderId,
        orderName: '기부금',
        customerName: name,
        successUrl: `${window.location.origin}/thank-you?provider=toss&orderId=${orderId}`,
        failUrl: `${window.location.origin}/fail?provider=toss`,
      })
    } catch (err) {
      console.error(err)
      alert('Toss 결제가 시작되지 못했습니다.')
      setIsSubmitting(false)
    }
  }

  async function handleKakaoPay() {
    if (!finalAmount || !name) return
    setIsSubmitting(true)
    try {
      // Ask our backend to create a KakaoPay payment session
      const { data } = await api.post('/kakao/ready', {
        orderId,
        amount: finalAmount,
        name,
        message,
      })
      // Kakao returns redirect url to payment page
      window.location.href = data.redirectUrl
    } catch (err) {
      console.error(err)
      alert('KakaoPay 결제를 시작하지 못했습니다.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">기부하기</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Amount presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700">금액</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setAmount(preset); setCustomAmount('') }}
                  className={`rounded border px-3 py-2 text-sm ${finalAmount === preset && !customAmount ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  ₩{preset.toLocaleString()}
                </button>
              ))}
              <input
                type="number"
                min={1000}
                placeholder="직접 입력"
                className="w-40 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Donor info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">이름</label>
              <input
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">메시지 (선택)</label>
              <input
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="응원합니다!"
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">결제 수단을 선택하세요.</p>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              disabled={isSubmitting || !finalAmount || !name}
              onClick={handleTossPayment}
              className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Toss Payments로 기부
            </button>
            <button
              disabled={isSubmitting || !finalAmount || !name}
              onClick={handleKakaoPay}
              className="flex-1 rounded bg-yellow-400 px-4 py-2 text-gray-900 hover:bg-yellow-500 disabled:opacity-50"
            >
              KakaoPay로 기부
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}