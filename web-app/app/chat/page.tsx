'use client'

import { useChat } from 'ai/react';
import { useState, useCallback, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import TaxonomyPanel from '@/components/TaxonomyPanel';
import type { StreamingTaxonomyState } from '@/components/types';

export default function ChatPage() {
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

  return (
    <div className="h-screen p-4 max-w-[2000px] mx-auto">
      <div className="flex gap-4 h-[calc(100vh-2rem)]">
        <div className="flex-1 min-w-0">
          <ChatInterface 
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
          />
        </div>
        <div className="w-96">
          <TaxonomyPanel 
            taxonomyState={taxonomyState}
          />
        </div>
      </div>
    </div>
  );
}