import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/index.css'

import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionProvider } from '@/contexts/PermissionContext'
import { ToastProvider } from '@/providers/ToastProvider'
import { SubdomainProvider } from '@/context/SubdomainContext'
import { HostelProvider } from '@/context/HostelContext'
import {StripeProvider} from '@/contexts/StripeContext';
import { ConditionalHostelModal } from '@/components/ConditionalHostelModal'
import { PasswordChangeRequirement } from '@/components/auth/PasswordChangeRequirement'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HostelHive - Hostel Management System',
  description: 'A comprehensive hostel management system for owners and administrators',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SubdomainProvider>
          <AuthProvider>
            <StripeProvider>
            <PermissionProvider>
              <HostelProvider>
                <main id="main-content">
                  {children}
                </main>
                <ConditionalHostelModal />
                <PasswordChangeRequirement />
                <ToastProvider />
              </HostelProvider>
            </PermissionProvider>
            </StripeProvider>
          </AuthProvider>
        </SubdomainProvider>
      </body>
    </html>
  )
}
