import { Database } from '@/lib/database.types';
import { createClient } from '@/utils/supabase/client';

interface SyntheticOutput {
  scenario: string;
  response: string;
}

export async function updateSyntheticData(
  projectId: number,
  outputs: SyntheticOutput[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  console.log(`\n=== Starting Synthetic Data Update ===`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Number of outputs to process: ${outputs.length}`);

  try {
    // First verify that the project exists
    console.log('\nVerifying project existence...');
    const { data: projectExists, error: projectError } = await supabase
      .from('project')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !projectExists) {
      console.error('Project verification failed:', projectError);
      throw new Error(`Project with ID ${projectId} not found`);
    }
    console.log('Project verification successful');

    // Get the current highest ID
    console.log('\nChecking current highest ID in synthetic_data...');
    const { data: maxIdResult, error: maxIdError } = await supabase
      .from('synthetic_data')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error('Error getting max ID:', maxIdError);
      throw maxIdError;
    }
    const currentMaxId = maxIdResult && maxIdResult[0] ? maxIdResult[0].id : 0;
    console.log(`Current highest ID: ${currentMaxId}`);

    // Prepare the data for insertion
    console.log('\nPreparing data for insertion...');
    const dataToInsert = outputs.map((output) => ({
      project_id: projectId,
      data: output.response
    }));
    console.log(`Prepared ${dataToInsert.length} entries for insertion`);

    // Insert the synthetic data entries
    console.log('\nInserting synthetic data...');
    const { error: insertError, data: insertedData } = await supabase
      .from('synthetic_data')
      .insert(dataToInsert)
      .select();

    if (insertError) {
      console.error('Insert operation failed:', insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${dataToInsert.length} entries`);
    if (insertedData) {
      console.log('First inserted ID:', insertedData[0]?.id);
      console.log('Last inserted ID:', insertedData[insertedData.length - 1]?.id);
    }

    console.log('\n=== Update Operation Completed Successfully ===\n');
    return { success: true };

  } catch (error) {
    console.error('\n=== Error in Synthetic Data Update ===');
    console.error('Error details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

export async function batchUpdateSyntheticData(
  projectId: number,
  outputs: SyntheticOutput[],
  batchSize: number = 50
): Promise<{ success: boolean; error?: string }> {
  console.log('\n=== Starting Batch Update Process ===');
  console.log(`Total outputs to process: ${outputs.length}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Total batches: ${Math.ceil(outputs.length / batchSize)}`);

  try {
    // Process outputs in batches
    for (let i = 0; i < outputs.length; i += batchSize) {
      const batch = outputs.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      console.log(`\nProcessing batch ${batchNumber}/${Math.ceil(outputs.length / batchSize)}`);
      console.log(`Batch size: ${batch.length} items`);
      
      const result = await updateSyntheticData(projectId, batch);
      
      if (!result.success) {
        console.error(`Batch ${batchNumber} failed:`, result.error);
        throw new Error(`Failed to process batch ${batchNumber}: ${result.error}`);
      }
      console.log(`Batch ${batchNumber} completed successfully`);
    }

    console.log('\n=== Batch Update Process Completed Successfully ===\n');
    return { success: true };
  } catch (error) {
    console.error('\n=== Error in Batch Update Process ===');
    console.error('Error details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}