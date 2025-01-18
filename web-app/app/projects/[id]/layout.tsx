'use client'

import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const projectId = params.id

  const tabs = [
    { value: 'setup', label: 'Setup', href: `/projects/${projectId}` },
    { value: 'benchmarks', label: 'Benchmarks', href: `/projects/${projectId}/benchmarks` },
    { value: 'judge', label: 'Judge Builder', href: `/projects/${projectId}/judge` },
  ]

  // Determine active tab based on the current pathname
  const getCurrentTab = () => {
    if (pathname === `/projects/${projectId}`) return 'setup'
    const path = pathname.split('/').pop()
    return path || 'setup'
  }

  return (
    <div className="flex-1 w-full flex flex-col">
      <div className="w-full px-4">
        <Tabs value={getCurrentTab()} className="w-full space-y-6">
          <TabsList className="w-full justify-start">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} asChild>
                <Link href={tab.href}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="w-full">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  )
} 