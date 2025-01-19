'use client'

import { useState, useCallback, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ProjectTabs from './components/ProjectTabs'
import TaxonomyPanel from '@/components/TaxonomyPanel';
import ChatInterface from '@/components/ChatInterface';
import type { StreamingTaxonomyState } from '@/components/types';
import { useParams } from 'next/navigation';

interface Project {
  name: string;
  model_summary: string;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : undefined;

  const [project, setProject] = useState<Project>({
    name: '',
    model_summary: ''
  });

  const [taxonomyState, setTaxonomyState] = useState<StreamingTaxonomyState>({
    isStreaming: false,
    content: ''
  });

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      const specMatch = message.content.match(/```spec\n([\s\S]*?)```/);
      if (specMatch) {
        setTaxonomyState({
          isStreaming: false,
          content: specMatch[1]
        });
      }
    }
  });

  const handleUpdate = (field: keyof Project, value: string) => {
    setProject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMessage = useCallback((content: string) => {
    if (content.includes('```spec\n')) {
      const specStartIndex = content.indexOf('```spec\n');
      const specEndIndex = content.indexOf('```', specStartIndex + 7);
      
      if (specEndIndex !== -1) {
        const specContent = content.substring(specStartIndex + 8, specEndIndex);
        setTaxonomyState({
          isStreaming: false,
          content: specContent
        });
      } else {
        const specContent = content.substring(specStartIndex + 8);
        setTaxonomyState({
          isStreaming: true,
          content: specContent
        });
      }
    }
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      handleMessage(lastMessage.content);
    }
  }, [messages, handleMessage]);

  if (!projectId) {
    return <div>No project ID provided</div>;
  }

  return (
    <>
      <ProjectTabs />
      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Input Taxonomy Generation</CardTitle>
            <CardDescription>Chat with IO to generate your input taxonomy</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100vh-200px)]">
            <div className="flex flex-col lg:flex-row gap-4 h-full">
              <div className="flex-1 min-w-0">
                <ChatInterface 
                  messages={messages}
                  input={input}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                />
              </div>
              <div> {/* Adjust the width of the TaxonomyPanel */}
                <TaxonomyPanel 
                  taxonomyState={taxonomyState}
                  projectId={projectId}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}