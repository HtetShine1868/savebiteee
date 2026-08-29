import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar.jsx'
import { Footer } from './Footer.jsx'
import { MobileTabBar } from './MobileTabBar.jsx'
import { ChatWidget } from '../chat/ChatWidget.jsx'
import { useReserve } from '../../context/reserve-context.js'

export function AppLayout() {
  const { openReserve } = useReserve()

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <ChatWidget onReserve={openReserve} />
    </div>
  )
}
