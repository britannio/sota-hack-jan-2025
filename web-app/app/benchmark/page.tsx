'use client'

import { createClient } from '@/utils/supabase/client'
import AddModelButton from './AddModelButton'
import { useEffect, useState } from 'react'

interface ModelCard {
    id: number
    score: number | null
}

export default function BenchmarkPage() {
    const [models, setModels] = useState<ModelCard[]>([])

    useEffect(() => {
        const fetchModels = async () => {
            const client = createClient()
            const { data, error } = await client
                .from('model')
                .select('id, score')
                .order('score', { ascending: false })

            if (!error && data) {
                setModels(data)
            }
        }

        fetchModels()
    }, [])

    return (
        <div className="min-h-screen flex justify-center">
            <div className="max-w-5xl w-full px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Benchmark</h1>

                <div className="space-y-4">
                    {
                        models.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">Create your first model</p>
                            </div>
                        )
                    }
                    {models.map((model) => (
                        <div
                            key={model.id}
                            className="p-6 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-semibold text-gray-500">
                                        {model.id}.
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-blue-600">
                                        {model.score === null ? 'Not rated' : `Score ${model.score}%`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <AddModelButton onModelAdded={(newModel) => {
                        setModels([...models, newModel])
                    }} />
                </div>
            </div>
        </div>
    )
}
