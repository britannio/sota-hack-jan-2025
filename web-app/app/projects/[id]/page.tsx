'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import ProjectTabs from './components/ProjectTabs'

interface Project {
  id: string
  name: string
  model_summary?: string
  model_input_dimensions?: any
  judge_prompt?: string
}

export default function ProjectSetup() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('project')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching project:', error)
        return
      }

      setProject(data)
      setIsLoading(false)
    }

    fetchProject()
  }, [params.id, supabase])

  const handleUpdate = async (field: keyof Project, value: any) => {
    if (!project) return

    try {
      const { error } = await supabase
        .from('project')
        .update({ [field]: value })
        .eq('id', project.id)

      if (error) throw error

      setProject({ ...project, [field]: value })
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <>
      <ProjectTabs />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Setup</CardTitle>
            <CardDescription>Configure your model evaluation project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="name"
                value={project.name}
                onChange={(e) => handleUpdate('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="summary" className="text-sm font-medium">
                Model Summary
              </label>
              <Textarea
                id="summary"
                placeholder="Describe the model you're evaluating..."
                value={project.model_summary || ''}
                onChange={(e) => handleUpdate('model_summary', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 