'use client'

import { use, useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Toggle } from "@/components/ui/toggle"
import { createClient } from '@/utils/supabase/client'
import { Check, X, Download } from "lucide-react"

type JudgeData = {
    synthetic_data: { id: number, data: string }
    evaluation: {
        id: number,
        model_output: string
        judge_critique_text: string
        judge_pass: boolean | null
        expert_critique_text: string
        expert_pass: boolean | null
        improved_output: string | null
    }
}

export default function JudgePage({ params }: { params: Promise<{ id: string, model_id: string }> }) {
    const { id, model_id } = use(params)
    const projectId = parseInt(id)
    const modelId = parseInt(model_id)
    const [data, setData] = useState<JudgeData[]>([])
    const [project, setProject] = useState<any>(null)
    const [scores, setScores] = useState({ overall: 0, judgeQuality: 0 })
    const supabase = createClient()
    //   const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        async function fetchData() {
            // Fetch project details
            const { data: projectData } = await supabase
                .from('project')
                .select('*')
                .eq('id', projectId)
                .single()

            setProject(projectData)

            // Fetch combined data with new table structure
            const { data: evaluationData } = await supabase
                .from('synthetic_data')
                .select(`
                    id,
                    data,
                    model_evaluation!inner (
                        id,
                        model_output,
                        judge_critique_text,
                        judge_pass,
                        expert_critique_text,
                        expert_pass,
                        improved_output
                    )
                `)
                .eq('project_id', projectId)
                .eq('model_evaluation.model_id', modelId)

            // Transform data for table
            const transformedData = evaluationData?.map(row => ({
                synthetic_data: { id: row.id, data: row.data || '' },
                evaluation: {
                    id: row.id,
                    model_output: row.model_evaluation[0].model_output || '',
                    judge_critique_text: row.model_evaluation[0].judge_critique_text || '',
                    judge_pass: row.model_evaluation[0].judge_pass,
                    expert_critique_text: row.model_evaluation[0].expert_critique_text || '',
                    expert_pass: row.model_evaluation[0].expert_pass,
                    improved_output: row.model_evaluation[0].improved_output
                }
            })) || []

            setData(transformedData as JudgeData[])

            // Calculate scores
            const totalEntries = transformedData.length
            const judgePassCount = transformedData.filter(row => row.evaluation.judge_pass === true).length
            const expertPassCount = transformedData.filter(row => row.evaluation.expert_pass === true).length
            const matchingDecisions = transformedData.filter(
                row => row.evaluation.judge_pass === row.evaluation.expert_pass
            ).length

            setScores({
                overall: totalEntries ? (expertPassCount / totalEntries) * 100 : 0,
                judgeQuality: totalEntries ? (matchingDecisions / totalEntries) * 100 : 0
            })
        }

        fetchData()
    }, [projectId, modelId, supabase])

    const updateExpertCritique = async (index: number, updates: {
        expert_pass?: boolean | null,
        expert_critique_text?: string,
        improved_output?: string
    }) => {
        const row = data[index]
        
        await supabase
            .from('model_evaluation')
            .update({
                ...updates
            })
            .eq('model_id', modelId)
            .eq('synthetic_data_id', index + 1)

        // Update local state
        const newData = [...data]
        newData[index].evaluation = {
            ...newData[index].evaluation,
            ...updates
        }
        setData(newData)
    }

    const updateJudgePrompt = async (newPrompt: string) => {
        await supabase
            .from('project')
            .update({ judge_prompt: newPrompt })
            .eq('id', projectId)

        // Update local state
        setProject({
            ...project,
            judge_prompt: newPrompt
        })
    }

    const downloadInputs = () => {
        const inputs = data.map((row, index) => ({
            id: row.evaluation.id || "xxx",
            input: row.synthetic_data.data
        }))
        const blob = new Blob([JSON.stringify(inputs, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `inputs-project-${projectId}-model-${modelId}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const importOutputs = async () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const outputs = JSON.parse(e.target?.result as string)
                    
                    // Update each evaluation individually
                    const updatePromises = outputs.map((item: { id: number, output: string }) =>
                        supabase
                            .from('model_evaluation')
                            .update({ model_output: item.output })
                            .eq('model_id', modelId)
                            .eq('synthetic_data_id', item.id)
                    )

                    await Promise.all(updatePromises)

                    // Refresh the page data
                    window.location.reload()
                } catch (error) {
                    console.error('Error importing outputs:', error)
                    alert('Error importing outputs. Please check the file format.')
                }
            }
            reader.readAsText(file)
        }
        
        input.click()
    }

    const syncSyntheticData = async () => {
        // First, get all synthetic data for this project
        const { data: syntheticData } = await supabase
            .from('synthetic_data')
            .select('id')
            .eq('project_id', projectId)

        if (!syntheticData) return

        // Get existing model evaluations
        const { data: existingEvaluations } = await supabase
            .from('model_evaluation')
            .select('synthetic_data_id')
            .eq('model_id', modelId)
            .eq('project_id', projectId)

        // Filter out synthetic data that already has evaluations
        const existingIds = new Set(existingEvaluations?.map(e => e.synthetic_data_id) || [])
        const missingEvaluations = syntheticData.filter(row => !existingIds.has(row.id))

        if (missingEvaluations.length === 0) {
            alert('All synthetic data already has evaluation entries')
            return
        }

        // Insert only the missing evaluations
        const { error } = await supabase
            .from('model_evaluation')
            .insert(
                missingEvaluations.map(row => ({
                    synthetic_data_id: row.id,
                    model_id: modelId,
                    project_id: projectId,
                    // Set defaults for other fields
                    model_output: null,
                    judge_critique_text: null,
                    judge_pass: null,
                    expert_critique_text: null,
                    expert_pass: null,
                    improved_output: null
                }))
            )

        if (error) {
            console.error('Error syncing data:', error)
            alert('Error syncing data')
            return
        }

        // Refresh the page data
        window.location.reload()
    }

    return (
        <div className="p-8">
            {project && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold">Model Evaluation</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={syncSyntheticData}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                            >
                                Sync Synthetic Data
                            </button>
                            <button
                                onClick={importOutputs}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                                <Download className="h-4 w-4 rotate-180" />
                                Import Outputs
                            </button>
                            <button
                                onClick={downloadInputs}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Download Inputs
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col">
                                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Overall Score</h2>
                                <div className="mt-2 flex items-baseline">
                                    <p className="text-3xl font-bold text-gray-900">{scores.overall.toFixed(1)}%</p>
                                    <span className="ml-2 text-sm text-gray-500">pass rate</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col">
                                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Judge Quality</h2>
                                <div className="mt-2 flex items-baseline">
                                    <p className="text-3xl font-bold text-gray-900">{scores.judgeQuality.toFixed(1)}%</p>
                                    <span className="ml-2 text-sm text-gray-500">agreement</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg bg-white shadow-sm">
                            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Judge Prompt</h2>
                            <textarea
                                className="w-full min-h-[100px] p-2 text-sm border rounded mt-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={project.judge_prompt || ''}
                                onChange={(e) => updateJudgePrompt(e.target.value)}
                                placeholder="Enter judge prompt..."
                            />
                        </div>
                    </div>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Input</TableHead>
                        <TableHead>Output</TableHead>
                        <TableHead>LLM Judge Decision</TableHead>
                        <TableHead>Expert Decision</TableHead>
                        <TableHead>Agreement</TableHead>
                        <TableHead>Improved Output</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell className="align-top">{row.synthetic_data.data}</TableCell>
                            <TableCell className="align-top">{row.evaluation.model_output}</TableCell>
                            <TableCell className="align-top">
                                <div className="space-y-2">
                                    <p className="text-sm">{row.evaluation.judge_critique_text}</p>
                                    <div className="flex gap-2">
                                        <Toggle
                                            disabled
                                            pressed={row.evaluation.judge_pass === true}
                                            variant="outline"
                                            className={`${row.evaluation.judge_pass === true ? "bg-green-100 text-green-700" : ""} 
                                                      data-[state=on]:bg-green-100 data-[state=on]:text-green-700`}
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Pass
                                        </Toggle>
                                        <Toggle
                                            disabled
                                            pressed={row.evaluation.judge_pass === false}
                                            variant="outline"
                                            className={`${row.evaluation.judge_pass === false ? "bg-red-100 text-red-700" : ""}
                                                      data-[state=on]:bg-red-100 data-[state=on]:text-red-700`}
                                        >
                                            <X className="h-4 w-4 mr-1" /> Fail
                                        </Toggle>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="align-top">
                                <div className="space-y-2">
                                    <textarea
                                        className="w-full min-h-[100px] p-2 text-sm border rounded"
                                        value={row.evaluation.expert_critique_text || ''}
                                        onChange={(e) => updateExpertCritique(index, { 
                                            expert_critique_text: e.target.value 
                                        })}
                                        placeholder="Enter expert feedback..."
                                    />
                                    <div className="flex gap-2">
                                        <Toggle
                                            pressed={row.evaluation.expert_pass === true}
                                            onPressedChange={(pressed) =>
                                                updateExpertCritique(index, { 
                                                    expert_pass: pressed ? true : null 
                                                })
                                            }
                                            variant="outline"
                                            className={`${row.evaluation.expert_pass === true ? "bg-green-100 text-green-700" : ""} 
                                                      data-[state=on]:bg-green-100 data-[state=on]:text-green-700`}
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Pass
                                        </Toggle>
                                        <Toggle
                                            pressed={row.evaluation.expert_pass === false}
                                            onPressedChange={(pressed) =>
                                                updateExpertCritique(index, { 
                                                    expert_pass: pressed ? false : null 
                                                })
                                            }
                                            variant="outline"
                                            className={`${row.evaluation.expert_pass === false ? "bg-red-100 text-red-700" : ""}
                                                      data-[state=on]:bg-red-100 data-[state=on]:text-red-700`}
                                        >
                                            <X className="h-4 w-4 mr-1" /> Fail
                                        </Toggle>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="align-top">
                                {row.evaluation.judge_pass !== null && 
                                 row.evaluation.expert_pass !== null && (
                                    row.evaluation.judge_pass === row.evaluation.expert_pass ? (
                                        <Check className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <X className="h-5 w-5 text-red-600" />
                                    )
                                )}
                            </TableCell>
                            <TableCell className="align-top">
                                <textarea
                                    className="w-full min-h-[100px] p-2 text-sm border rounded"
                                    value={row.evaluation.improved_output || ''}
                                    onChange={(e) => updateExpertCritique(index, { 
                                        improved_output: e.target.value 
                                    })}
                                    placeholder="Enter improved output..."
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
} 