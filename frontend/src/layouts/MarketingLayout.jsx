import React from 'react'
import { Outlet } from 'react-router-dom'
import MarketingNavbar from '../components/navigation/MarketingNavbar'
import MarketingFooter from '../components/navigation/MarketingFooter'

/** Dark public marketing shell: fixed navbar + content + footer. */
export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-marketing-bg text-marketing-text">
      <MarketingNavbar />
      <main>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  )
}
