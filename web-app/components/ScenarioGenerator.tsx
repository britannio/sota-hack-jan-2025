import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Dimension {
  name: string;
  subdimensions: string[];
}

interface ProcessedScenario {
  scenario: string;
  response: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  dbStatus?: 'pending' | 'success' | 'error';
}

interface ScenarioGeneratorProps {
  dimensions: Dimension[];
  projectId: number;
}

const ScenarioGenerator: React.FC<ScenarioGeneratorProps> = ({ dimensions, projectId }) => {
  const [processedScenarios, setProcessedScenarios] = useState<ProcessedScenario[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  const generateScenarios = (): string[] => {
    const validDimensions = dimensions.filter(d => d.subdimensions.length > 0);
    
    const generateCombinations = (
      dims: Dimension[],
      current: string[] = [],
      index: number = 0
    ): string[] => {
      if (index === dims.length) {
        const scenario = dims
          .map((dim, i) => `${dim.name}: ${current[i]}`)
          .join('. ');
        return [scenario];
      }

      return dims[index].subdimensions.flatMap(subdim => 
        generateCombinations(
          dims,
          [...current, subdim],
          index + 1
        )
      );
    };

    return generateCombinations(validDimensions);
  };

  const getTotalCombinations = (): number => {
    return dimensions.reduce((acc, dim) => {
      const count = dim.subdimensions.length || 1;
      return acc * count;
    }, 1);
  };

  const updateDatabase = async (scenario: string, response: string): Promise<boolean> => {
    console.log('\n=== Updating Supabase ===');
    console.log('Project ID:', projectId);
    console.log('Scenario:', scenario);
    console.log('Response:', response);

    try {
      const { error } = await supabase
        .from('synthetic_data')
        .insert([{
          project_id: projectId,
          data: response
        }]);

      if (error) {
        console.error('Supabase insert error:', error);
        return false;
      }

      console.log('Successfully inserted into Supabase');
      return true;
    } catch (error) {
      console.error('Error updating Supabase:', error);
      return false;
    }
  };

  const processScenario = async (scenario: string): Promise<string> => {
    const response = await fetch('/api/synthetic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenario }),
    });

    if (!response.ok) {
      throw new Error('Failed to process scenario');
    }

    const data = await response.json();
    return data.response;
  };

  const processAllScenarios = async () => {
    setIsProcessing(true);
    setCurrentIndex(0);
    
    const scenarios = generateScenarios();
    console.log(`Generated ${scenarios.length} scenarios`);
    
    // Initialize all scenarios as pending
    setProcessedScenarios(
      scenarios.map(scenario => ({
        scenario,
        response: '',
        status: 'pending',
        dbStatus: 'pending'
      }))
    );

    // Process scenarios one by one
    for (let i = 0; i < scenarios.length; i++) {
      setCurrentIndex(i);
      
      // Update status to processing
      setProcessedScenarios(prev => prev.map((item, index) => 
        index === i ? { ...item, status: 'processing' } : item
      ));

      try {
        // Process the scenario
        const response = await processScenario(scenarios[i]);
        console.log(`Processed scenario ${i + 1}/${scenarios.length}:`, {
          scenario: scenarios[i],
          response
        });

        // Immediately update Supabase after getting the response
        const dbSuccess = await updateDatabase(scenarios[i], response);

        // Update state with response and database status
        setProcessedScenarios(prev => prev.map((item, index) => 
          index === i ? {
            ...item,
            response,
            status: 'completed',
            dbStatus: dbSuccess ? 'success' : 'error'
          } : item
        ));

      } catch (error) {
        console.error(`Error processing scenario ${i + 1}:`, error);
        
        setProcessedScenarios(prev => prev.map((item, index) => 
          index === i ? {
            ...item,
            status: 'error',
            response: 'Error processing scenario',
            dbStatus: 'error'
          } : item
        ));
      }
    }

    setIsProcessing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Scenario Generator</span>
          <span className="text-sm text-gray-500">
            Total combinations: {getTotalCombinations()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button
            onClick={processAllScenarios}
            disabled={isProcessing}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Scenario {currentIndex + 1}/{getTotalCombinations()}
              </>
            ) : (
              'Generate & Process Scenarios'
            )}
          </Button>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-4">
          {processedScenarios.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="font-medium mb-2">
                Scenario {index + 1}:
                <span className="ml-2 text-sm">
                  {item.status === 'pending' && '⏳ Pending'}
                  {item.status === 'processing' && '🔄 Processing'}
                  {item.status === 'completed' && '✅ Completed'}
                  {item.status === 'error' && '❌ Error'}
                  {item.dbStatus && (
                    <span className="ml-2">
                      {item.dbStatus === 'success' && '💾 Saved'}
                      {item.dbStatus === 'error' && '⚠️ DB Error'}
                    </span>
                  )}
                </span>
              </div>
              <div className="mb-2 text-gray-700">{item.scenario}</div>
              {item.response && (
                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                  <div className="font-medium mb-1">Response:</div>
                  <div className="text-gray-600">{item.response}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioGenerator;