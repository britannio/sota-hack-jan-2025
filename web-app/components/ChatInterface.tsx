import { useRef, useEffect } from 'react';
import { Message } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ChatInterface({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit 
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const processMessageContent = (content: string) => {
    return content.replace(/```spec\n[\s\S]*?```/g, '').trim();
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-[800px] bg-white rounded-lg shadow-sm">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => {
          const displayContent = processMessageContent(message.content);
          if (!displayContent) return null;

          return (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white ml-auto max-w-[80%]' 
                  : 'bg-gray-100 mr-auto max-w-[80%]'
              }`}
            >
              <div className="font-semibold mb-1">
                {message.role === 'user' ? 'You' : 'IO'}
              </div>
              <div className="whitespace-pre-wrap">{displayContent}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask IO anything..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}