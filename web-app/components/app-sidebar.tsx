'use client'
import { Calendar, Home, Inbox, Link, Search, Settings, Plus, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useEffect, useState } from 'react'
import { createClient } from "@/utils/supabase/client"

// Menu items.
const items = [
    {
        title: "Home",
        url: "#",
        icon: Home,
    },
    {
        title: "Inbox",
        url: "#",
        icon: Inbox,
    },
    {
        title: "Calendar",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Search",
        url: "#",
        icon: Search,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
]

export function AppSidebar() {
    const [projects, setProjects] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        // Initial fetch
        const fetchProjects = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            const { data } = await supabase
                .from('project')
                .select('*')
                .order('id')

            if (data) setProjects(data)
        }

        // Set up real-time subscription
        const channel = supabase
            .channel('project-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'project',
                },
                async (payload) => {
                    // Refresh the projects when changes occur
                    fetchProjects()
                }
            )
            .subscribe()

        fetchProjects()

        // Cleanup subscription
        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return (
        <Sidebar>
            <SidebarHeader>
                <Link href="/">
                    Model Evaluation Hub
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Projects</SidebarGroupLabel>
                    <SidebarMenuButton asChild>
                        <Button variant="outline" asChild className="w-full justify-start">
                            <a href="/projects/new">
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Create new project
                            </a>
                        </Button>
                    </SidebarMenuButton>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects.map((project) => (
                                <SidebarMenuItem key={project.id}>
                                    <SidebarMenuButton asChild>
                                        <a href={`/projects/${project.id}`}>
                                            <span>{project.name}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

