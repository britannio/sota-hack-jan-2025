import React, { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import ScenarioGenerator from './ScenarioGenerator';
import type { StreamingTaxonomyState } from './types';
import { testScenarioGeneration } from './ScenarioGeneratorTest';

interface TaxonomyJson {
  dimensions: Array<{
    name: string;
    subdimensions: string[];
    decision_logic: string;
    objective: string;
  }>;
  summary: string;
}

interface TaxonomyPanelProps {
    taxonomyState: StreamingTaxonomyState;
    onUpdateTaxonomy?: (newContent: string) => void;
    projectId: number; // Add projectId to props
}

type ViewMode = 'raw' | 'structured' | 'scenarios';

const TaxonomyPanel: React.FC<TaxonomyPanelProps> = ({ taxonomyState, onUpdateTaxonomy, projectId }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState('');
  const [isAutomating, setIsAutomating] = useState(false);
  const [automatedJson, setAutomatedJson] = useState<TaxonomyJson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('raw');
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (contentRef.current && taxonomyState.isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [taxonomyState.content, taxonomyState.isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !taxonomyState.isStreaming && onUpdateTaxonomy) {
      onUpdateTaxonomy(taxonomyState.content + '\n' + userInput.trim());
      setUserInput('');
    }
  };

  const handleAutomate = async () => {
    try {
      setIsAutomating(true);
      setAutomatedJson(null);
      setError(null);

      console.log('Sending taxonomy for automation:', taxonomyState.content);

      const response = await fetch('/api/taxonomy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taxonomy: taxonomyState.content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.error || 'Failed to automate taxonomy');
      }

      console.log('Received automated taxonomy:', data);
      setAutomatedJson(data);
      setViewMode('structured');
      
      // Add this line to test scenario generation
      await testScenarioGeneration(data);
    } catch (error) {
      console.error('Error automating taxonomy:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsAutomating(false);
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      );
    }

    switch (viewMode) {
        case 'scenarios':
            return automatedJson ? (
              <div className="h-full overflow-y-auto">
                <ScenarioGenerator
                  dimensions={automatedJson.dimensions.map(dim => ({
                    name: dim.name,
                    subdimensions: dim.subdimensions
                  }))}
                  projectId={projectId} // Pass projectId to ScenarioGenerator
                />
              </div>
            ) : null;
            
      case 'structured':
        return automatedJson ? (
          <div className="h-full bg-gray-50 rounded-md p-4 overflow-y-auto">
            {automatedJson.dimensions.map((dim, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="font-semibold text-lg mb-2">{dim.name}</h3>
                <div className="ml-4 space-y-2">
                  <div>
                    <span className="font-medium">Subdimensions:</span>
                    <ul className="list-disc ml-6">
                      {dim.subdimensions.map((sub, subIdx) => (
                        <li key={subIdx}>{sub}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium">Decision Logic:</span>
                    <p className="ml-2">{dim.decision_logic}</p>
                  </div>
                  <div>
                    <span className="font-medium">Objective:</span>
                    <p className="ml-2">{dim.objective}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Summary</h3>
              <p>{automatedJson.summary}</p>
            </div>
          </div>
        ) : null;

      default:
        return (
          <div 
            ref={contentRef}
            className="h-full bg-gray-50 rounded-md p-4 overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            {taxonomyState.content || "No taxonomy generated yet. Chat with IO to generate one!"}
          </div>
        );
    }
  };

  return (
    <Card className="h-full w-96 flex flex-col">
      <CardHeader className="pb-4 flex-none">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            Current Taxonomy
            {taxonomyState.isStreaming && (
              <span className="ml-2 text-sm text-gray-500 animate-pulse">
                (Streaming...)
              </span>
            )}
          </div>
          {automatedJson && (
            <div className="flex gap-2">
              {viewMode !== 'raw' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('raw')}
                  className="text-sm"
                >
                  View Raw
                </Button>
              )}
              {viewMode !== 'structured' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('structured')}
                  className="text-sm"
                >
                  View Structured
                </Button>
              )}
              {viewMode !== 'scenarios' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('scenarios')}
                  className="text-sm"
                >
                  View Scenarios
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4 overflow-hidden">
        {renderContent()}
        
        {viewMode === 'raw' && (
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-2">
              <Input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Add to taxonomy..."
                disabled={taxonomyState.isStreaming}
                className="flex-1"
              />
              <Button 
                type="submit"
                disabled={taxonomyState.isStreaming || !userInput.trim()}
                variant="secondary"
              >
                Add
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4 flex-none">
        {viewMode === 'raw' && (
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleAutomate}
            disabled={isAutomating || !taxonomyState.content || taxonomyState.isStreaming}
          >
            {isAutomating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Automate Taxonomy'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TaxonomyPanel;