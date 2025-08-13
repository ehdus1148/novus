import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const app = express()
app.use(express.json())

// Allow frontend origin
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
app.use(cors({ origin: CLIENT_URL, credentials: false }))

// Simple in-memory store for demo purposes
const donations = []
let totalRaised = 0

const TARGET_AMOUNT = Number(process.env.TARGET_AMOUNT || 100_000_000)

// Health
app.get('/api/health', (_, res) => res.json({ ok: true }))

// Metrics (target & total)
app.get('/api/metrics', (_, res) => {
  res.json({ targetAmount: TARGET_AMOUNT, totalRaised })
})

// List donations
app.get('/api/donations', (_, res) => {
  // newest first
  res.json([...donations].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
})

// Record a donation (called after success redirect)
app.post('/api/donations', (req, res) => {
  const { orderId, name, message, amount, provider } = req.body || {}
  if (!orderId || !name || !amount || !provider) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  const entry = {
    id: orderId,
    name,
    message,
    amount: Number(amount),
    provider,
    createdAt: new Date().toISOString(),
  }
  // avoid double count
  if (!donations.find((d) => d.id === orderId)) {
    donations.push(entry)
    totalRaised += entry.amount
  }
  res.json(entry)
})

// KakaoPay integration (test mode sample)
// Docs: Use CID=TC0ONETIME for testing. Requires Admin Key in Authorization header.
const KAKAO_API_BASE = process.env.KAKAO_API_BASE || 'https://kapi.kakao.com'
const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY || ''
const KAKAO_CID = process.env.KAKAO_CID || 'TC0ONETIME'
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001'

// Keep track of tid per orderId for approval step
const kakaoReadyStore = new Map()

// Create a payment session and get redirect URL
app.post('/api/kakao/ready', async (req, res) => {
  try {
    const { orderId, amount, name, message } = req.body
    if (!orderId || !amount || !name) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const params = new URLSearchParams()
    params.append('cid', KAKAO_CID)
    params.append('partner_order_id', orderId)
    params.append('partner_user_id', name)
    params.append('item_name', '기부금')
    params.append('quantity', '1')
    params.append('total_amount', String(amount))
    params.append('tax_free_amount', '0')
    // Redirect back to backend to approve, then we will redirect to FE Thank You
    const approveUrl = `${SERVER_URL}/api/kakao/approve?order_id=${encodeURIComponent(orderId)}&name=${encodeURIComponent(name)}&message=${encodeURIComponent(message || '')}`
    params.append('approval_url', approveUrl)
    params.append('cancel_url', `${CLIENT_URL}/fail?provider=kakao&canceled=1`)
    params.append('fail_url', `${CLIENT_URL}/fail?provider=kakao`)

    const { data } = await axios.post(`${KAKAO_API_BASE}/v1/payment/ready`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        Authorization: `KakaoAK ${KAKAO_ADMIN_KEY}`,
      },
    })

    // Store tid for approval
    kakaoReadyStore.set(orderId, { tid: data.tid, amount: Number(amount) })

    return res.json({ redirectUrl: data.next_redirect_pc_url || data.next_redirect_mobile_url || data.next_redirect_app_url })
  } catch (err) {
    console.error(err?.response?.data || err.message)
    return res.status(500).json({ error: 'KakaoPay ready failed' })
  }
})

// Approve payment after Kakao redirects here with pg_token
app.get('/api/kakao/approve', async (req, res) => {
  try {
    const { pg_token, order_id, name, message } = req.query
    if (!pg_token || !order_id) {
      return res.status(400).send('Missing pg_token or order_id')
    }
    const record = kakaoReadyStore.get(order_id)
    if (!record) {
      return res.status(400).send('Unknown order_id')
    }

    const params = new URLSearchParams()
    params.append('cid', KAKAO_CID)
    params.append('tid', record.tid)
    params.append('partner_order_id', order_id)
    params.append('partner_user_id', String(name || 'donor'))
    params.append('pg_token', String(pg_token))

    await axios.post(`${KAKAO_API_BASE}/v1/payment/approve`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        Authorization: `KakaoAK ${KAKAO_ADMIN_KEY}`,
      },
    })

    // Clear record
    kakaoReadyStore.delete(order_id)

    // Redirect to frontend Thank You with details
    const amount = record.amount
    const target = `${CLIENT_URL}/thank-you?provider=kakao&orderId=${encodeURIComponent(order_id)}&name=${encodeURIComponent(name || '')}&message=${encodeURIComponent(message || '')}&amount=${encodeURIComponent(amount)}`
    return res.redirect(target)
  } catch (err) {
    console.error(err?.response?.data || err.message)
    return res.redirect(`${CLIENT_URL}/fail?provider=kakao`)
  }
})

const PORT = Number(process.env.PORT || 3001)
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})