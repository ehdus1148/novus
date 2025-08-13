import { Outlet, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ThankYou from './pages/ThankYou'
import Fail from './pages/Fail'
import Navbar from './components/Navbar'

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-px max-w-5xl mx-auto py-8">
        <Outlet />
      </main>
      <footer className="border-t bg-white">
        <div className="container-px max-w-5xl mx-auto py-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Fundraising Demo
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}> 
        <Route index element={<Home />} />
        <Route path="thank-you" element={<ThankYou />} />
        <Route path="fail" element={<Fail />} />
      </Route>
    </Routes>
  )
}
