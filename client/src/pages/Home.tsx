import { useEffect, useState } from 'react'
import { api } from '../api'
import type { Donation, Metrics } from '../api'
import ProgressBar from '../components/ProgressBar'
import DonateModal from '../components/DonateModal'
import { formatKRW } from '../utils/currency'

export default function Home() {
  const [metrics, setMetrics] = useState<Metrics>({ targetAmount: 100000000, totalRaised: 0 })
  const [donations, setDonations] = useState<Donation[]>([])
  const [open, setOpen] = useState<boolean>(false)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const [m, d] = await Promise.all([
      api.get<Metrics>('/metrics').then((r) => r.data),
      api.get<Donation[]>('/donations').then((r) => r.data),
    ])
    setMetrics(m)
    setDonations(d)
  }

  const percent = metrics.targetAmount > 0 ? Math.min(100, (metrics.totalRaised / metrics.targetAmount) * 100) : 0

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-blue-50 to-white border rounded-xl p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">우리의 목표</h1>
        <p className="mt-1 text-gray-600">도움이 필요한 이웃을 위해 여러분의 소중한 기부를 모으고 있습니다.</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3 items-end">
          <div className="">
            <p className="text-sm text-gray-500">목표 금액</p>
            <p className="text-2xl font-semibold text-gray-900">{formatKRW(metrics.targetAmount)}</p>
          </div>
          <div className="">
            <p className="text-sm text-gray-500">현재 모금액</p>
            <p className="text-2xl font-semibold text-blue-700">{formatKRW(metrics.totalRaised)}</p>
          </div>
          <div className="sm:justify-self-end">
            <button onClick={() => setOpen(true)} className="w-full sm:w-auto rounded-lg bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700">
              기부하기
            </button>
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar value={percent} />
          <p className="mt-2 text-right text-sm text-gray-600">{percent.toFixed(1)}% 달성</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">최근 기부자</h2>
        <ul className="mt-3 grid gap-3">
          {donations.length === 0 && (
            <li className="text-sm text-gray-500">아직 기부가 없습니다. 첫 기부자가 되어 주세요!</li>
          )}
          {donations.map((d) => (
            <li key={d.id} className="rounded-lg border p-3 bg-white">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{d.name}</p>
                <p className="text-sm text-blue-700">{formatKRW(d.amount)}</p>
              </div>
              {d.message && <p className="mt-1 text-sm text-gray-600">“{d.message}”</p>}
              <p className="mt-1 text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>

      {open && (
        <DonateModal
          open={open}
          onClose={() => {
            setOpen(false)
            // After closing, refresh metrics to reflect possible updates (for Kakao approval redirect)
            setTimeout(refresh, 500)
          }}
        />
      )}
    </div>
  )
}