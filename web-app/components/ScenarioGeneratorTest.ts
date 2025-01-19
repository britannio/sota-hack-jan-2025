// ScenarioGeneratorTest.ts
interface Dimension {
    name: string;
    subdimensions: string[];
    decision_logic?: string;
    objective?: string;
  }
  
  interface JsonContext {
    dimensions: Dimension[];
    summary: string;
    projectId: number;
  }
  
  const processScenario = async (scenario: string, jsonContext: JsonContext): Promise<string> => {
    try {
      const response = await fetch('/api/synthetic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonContext,
          scenario,
        projectId: jsonContext.projectId
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error processing scenario:', error);
      return `Error: ${error.message}`;
    }
  };
  
  const generateAndLogScenarios = async (dimensions: Dimension[], jsonContext: JsonContext) => {
    const validDimensions = dimensions.filter(d => d.subdimensions.length > 0);
    
    console.log('\n=== Starting Scenario Generation ===');
    console.log('Input dimensions:', validDimensions);
    
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
    
    console.log('\n=== Generated Scenarios ===');
    console.log(`Total scenarios to process: ${scenarios.length}\n`);
    
    // Process scenarios sequentially
    console.log('=== Processing Scenarios ===\n');
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      console.log(`\nScenario ${i + 1}/${scenarios.length}:`);
      console.log('Input:', scenario);
      console.log('Processing...');
      
      const response = await processScenario(scenario, jsonContext);
      console.log('Response:', response);
      console.log('---');
    }
  
    const theoreticalTotal = validDimensions.reduce((acc, dim) => 
      acc * dim.subdimensions.length, 1
    );
    
    console.log('\n=== Final Summary ===');
    console.log(`Total scenarios processed: ${scenarios.length}`);
    console.log(`Theoretical combinations: ${theoreticalTotal}`);
    console.log(`Verification: ${theoreticalTotal === scenarios.length ? 'Passed ✅' : 'Failed ❌'}`);
  
    return scenarios;
  };
  
  // Test function to verify scenario generation and processing
  export const testScenarioGeneration = async (automatedJson: JsonContext) => {
    if (!automatedJson?.dimensions) {
      console.error('No dimensions found in automated JSON');
      return;
    }
  
    const dimensions = automatedJson.dimensions.map(dim => ({
      name: dim.name,
      subdimensions: dim.subdimensions,
      decision_logic: dim.decision_logic
    }));
  
    console.log('\n=== Testing Scenario Generation and Processing ===');
    console.log('Starting test with automated JSON...');
    
    await generateAndLogScenarios(dimensions, automatedJson);
  };