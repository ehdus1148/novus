import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: apiBaseUrl,
})

export type Donation = {
  id: string
  name: string
  message?: string
  amount: number
  provider: 'toss' | 'kakao'
  createdAt: string
}

export type Metrics = {
  targetAmount: number
  totalRaised: number
}