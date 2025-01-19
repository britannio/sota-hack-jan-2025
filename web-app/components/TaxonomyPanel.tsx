import React, { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StreamingTaxonomyState } from './types';

interface TaxonomyPanelProps {
  taxonomyState: StreamingTaxonomyState;
}

const TaxonomyPanel: React.FC<TaxonomyPanelProps> = ({ taxonomyState }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (contentRef.current && taxonomyState.isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [taxonomyState.content, taxonomyState.isStreaming]);

  return (
    <Card className="h-full w-96 flex flex-col">
      <CardHeader className="pb-4 flex-none">
        <CardTitle className="flex items-center">
          Current Taxonomy
          {taxonomyState.isStreaming && (
            <span className="ml-2 text-sm text-gray-500 animate-pulse">
              (Streaming...)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4 overflow-hidden">
        <div 
          ref={contentRef}
          className="h-full bg-gray-50 rounded-md p-4 overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        >
          {taxonomyState.content || "No taxonomy generated yet. Chat with IO to generate one!"}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex-none">
        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => {
            console.log('Automating taxonomy...');
          }}
        >
          Automate Taxonomy
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaxonomyPanel;