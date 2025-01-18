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
import { Check, X } from "lucide-react"

type JudgeData = {
    synthetic_data: { data: string }
    evaluation: {
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
                    data,
                    model_evaluation!inner (
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
                synthetic_data: { data: row.data || '' },
                evaluation: {
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

    return (
        <div className="p-8">
            {project && (
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-4">Model Evaluation</h1>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-4 border rounded">
                            <h2 className="font-semibold">Overall Score</h2>
                            <p>{scores.overall.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 border rounded">
                            <h2 className="font-semibold">Judge Quality</h2>
                            <p>{scores.judgeQuality.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 border rounded">
                            <h2 className="font-semibold">Judge Prompt</h2>
                            <textarea
                                className="w-full min-h-[100px] p-2 text-sm border rounded mt-2"
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