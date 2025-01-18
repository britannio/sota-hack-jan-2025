'use client'

import { createClient } from '@/utils/supabase/client'
import { Plus } from 'lucide-react'

interface AddModelButtonProps {
    onModelAdded: (model: { id: number; score: number | null }) => void
}

export default function AddModelButton({ onModelAdded }: AddModelButtonProps) {
    const handleAddModel = async () => {
        const client = createClient()
        const { data: newModel, error } = await client
            .from('model')
            .insert({ score: null })
            .select('id, score')
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