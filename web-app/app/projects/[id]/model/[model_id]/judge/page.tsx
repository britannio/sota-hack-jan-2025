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

type JudgeData = {
    synthetic_data: { data: string }
    model_output: { id: number, data: string }
    judge_critique: { critique_text: string; pass: boolean | null }
    expert_critique: { critique_text: string; pass: boolean | null }
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

            // Fetch combined data
            const { data: judgeData } = await supabase
                .from('synthetic_data')
                .select(`
          data,
          model_output!inner (
            id,
            data,
            judge_critique (critique_text, pass),
            expert_critique (critique_text, pass)
          )
        `)
                .eq('project_id', projectId)
                .eq('model_output.model_id', modelId)

            // Transform data for table
            const transformedData = judgeData?.map(row => ({
                synthetic_data: { data: row.data || '' },
                model_output: { 
                    id: row.model_output[0].id,
                    data: row.model_output[0].data || '' 
                },
                judge_critique: row.model_output[0].judge_critique[0] || { critique_text: '', pass: null },
                expert_critique: row.model_output[0].expert_critique[0] || { critique_text: '', pass: null }
            })) || []

            setData(transformedData as JudgeData[])

            // Calculate scores
            const totalEntries = transformedData.length
            const judgePassCount = transformedData.filter(row => row.judge_critique.pass === true).length
            const expertPassCount = transformedData.filter(row => row.expert_critique.pass === true).length
            const matchingDecisions = transformedData.filter(
                row => row.judge_critique.pass === row.expert_critique.pass
            ).length

            setScores({
                overall: totalEntries ? (expertPassCount / totalEntries) * 100 : 0,
                judgeQuality: totalEntries ? (matchingDecisions / totalEntries) * 100 : 0
            })
        }

        fetchData()
    }, [projectId, modelId, supabase])

    const updateExpertCritique = async (index: number, pass: boolean | null) => {
        const row = data[index]
        const modelOutputId = row.model_output.id

        await supabase
            .from('expert_critique')
            .upsert({
                model_output_id: modelOutputId,
                pass,
                critique_text: row.expert_critique.critique_text
            })

        // Update local state
        const newData = [...data]
        newData[index].expert_critique.pass = pass
        setData(newData)
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
                            <p className="text-sm">{project.judge_prompt}</p>
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell className="align-top">{row.synthetic_data.data}</TableCell>
                            <TableCell className="align-top">{row.model_output.data}</TableCell>
                            <TableCell className="align-top">
                                <div className="space-y-2">
                                    <p className="text-sm">{row.judge_critique.critique_text}</p>
                                    <div className="flex gap-2">
                                        <Toggle
                                            disabled
                                            pressed={row.judge_critique.pass === true}
                                            variant="outline"
                                        >
                                            Yes
                                        </Toggle>
                                        <Toggle
                                            disabled
                                            pressed={row.judge_critique.pass === false}
                                            variant="outline"
                                        >
                                            No
                                        </Toggle>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="align-top">
                                <div className="space-y-2">
                                    <p className="text-sm">{row.expert_critique.critique_text}</p>
                                    <div className="flex gap-2">
                                        <Toggle
                                            pressed={row.expert_critique.pass === true}
                                            onPressedChange={(pressed) =>
                                                updateExpertCritique(index, pressed ? true : null)
                                            }
                                            variant="outline"
                                        >
                                            Yes
                                        </Toggle>
                                        <Toggle
                                            pressed={row.expert_critique.pass === false}
                                            onPressedChange={(pressed) =>
                                                updateExpertCritique(index, pressed ? false : null)
                                            }
                                            variant="outline"
                                        >
                                            No
                                        </Toggle>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
} 