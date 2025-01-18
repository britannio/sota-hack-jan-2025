'use client'

import { createClient } from '@/utils/supabase/client'
import { Plus } from 'lucide-react'

interface AddModelButtonProps {
    onModelAdded: (model: { id: number; score: number | null, version_number: number }) => void,
    projectId: number,
    model_count: number
}

export default function AddModelButton({ onModelAdded, projectId, model_count }: AddModelButtonProps) {
    const handleAddModel = async () => {
        const client = createClient()
        const { data: newModel, error } = await client
            .from('model')
            .insert({ 
                score: null, 
                version_number: model_count + 1,
                project_id: projectId
            })
            .select('id, score, version_number')
            .single()

        if (!error && newModel) {
            onModelAdded(newModel)
        }
    }

    return (
        <button
            onClick={handleAddModel}
            className="w-full p-6 rounded-lg border-2 border-dashed border-gray-300 
                     flex items-center justify-center gap-2 hover:border-gray-400 
                     hover:bg-gray-50 transition-colors"
        >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Model</span>
        </button>
    )
} 