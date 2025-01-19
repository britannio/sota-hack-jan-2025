import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useDebugLog } from '@/utils/debug-logger';

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
  const logger = useDebugLog('ScenarioGenerator');
  const [processedScenarios, setProcessedScenarios] = useState<ProcessedScenario[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  // Log initial props with enhanced logger
  useEffect(() => {
    logger.info('Component initialized', { projectId, dimensions });
  }, [dimensions, projectId]);

  const generateScenarios = (): string[] => {
    logger.debug('Starting scenario generation');
    
    const validDimensions = dimensions.filter(d => d.subdimensions.length > 0);
    logger.debug('Filtered valid dimensions', validDimensions);
    
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

    const scenarios = generateCombinations(validDimensions);
    logger.info(`Generated ${scenarios.length} scenarios`, { scenarios });
    
    return scenarios;
  };

  const getTotalCombinations = (): number => {
    const total = dimensions.reduce((acc, dim) => {
      const count = dim.subdimensions.length || 1;
      return acc * count;
    }, 1);
    logger.debug('Calculated total combinations', { total });
    return total;
  };

  const updateDatabase = async (scenario: string, response: string): Promise<boolean> => {
    logger.debug('Attempting database update', { projectId, scenario });

    try {
      const { error } = await supabase
        .from('synthetic_data')
        .insert([{
          project_id: projectId,
          data: response
        }]);

      if (error) {
        logger.error('Database insert failed', error);
        return false;
      }

      logger.info('Database update successful');
      return true;
    } catch (error) {
      logger.error('Database update error', error);
      return false;
    }
  };

  const processScenario = async (scenario: string): Promise<string> => {
    logger.debug('Processing scenario', { scenario });

    try {
      const response = await fetch('/api/synthetic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario , projectId}),
      });

      if (!response.ok) {
        throw new Error(`API response not ok: ${response.status}`);
      }

      const data = await response.json();
      logger.debug('Received API response', data);
      return data.response;
    } catch (error) {
      logger.error('Scenario processing error', error);
      throw error;
    }
  };

  const processAllScenarios = async () => {
    logger.info('Starting batch processing');
    setIsProcessing(true);
    setCurrentIndex(0);
    
    const scenarios = generateScenarios();
    logger.info(`Beginning processing of ${scenarios.length} scenarios`);
    
    const initialScenarios = scenarios.map(scenario => ({
      scenario,
      response: '',
      status: 'pending' as const,
      dbStatus: 'pending' as const
    }));
    
    setProcessedScenarios(initialScenarios);

    for (let i = 0; i < scenarios.length; i++) {
      logger.debug(`Processing scenario ${i + 1}/${scenarios.length}`);
      setCurrentIndex(i);
      
      setProcessedScenarios(prev => {
        const updated = prev.map((item, index) => 
          index === i ? { ...item, status: 'processing' } : item
        );
        return updated;
      });

      try {
        const response = await processScenario(scenarios[i]);
        logger.debug('Scenario processed successfully', { scenario: scenarios[i], response });

        const dbSuccess = await updateDatabase(scenarios[i], response);

        setProcessedScenarios(prev => {
          const updated = prev.map((item, index) => 
            index === i ? {
              ...item,
              response,
              status: 'completed',
              dbStatus: dbSuccess ? 'success' : 'error'
            } : item
          );
          return updated;
        });

      } catch (error) {
        logger.error(`Error processing scenario ${i + 1}`, error);
        
        setProcessedScenarios(prev => {
          const updated = prev.map((item, index) => 
            index === i ? {
              ...item,
              status: 'error',
              response: 'Error processing scenario',
              dbStatus: 'error'
            } : item
          );
          return updated;
        });
      }
    }

    logger.info('Batch processing complete');
    setIsProcessing(false);
  };

  // Rest of the component remains the same...
  return (
    <Card className="w-full">
      {/* Existing JSX */}
    </Card>
  );
};

export default ScenarioGenerator;