'use client'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 w-full flex flex-col">
      <div className="w-full px-4">
        {children}
      </div>
    </div>
  )
} 