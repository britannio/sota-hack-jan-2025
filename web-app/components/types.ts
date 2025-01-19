// types.ts
import { Message } from 'ai/react';

export interface StreamingTaxonomyState {
    isStreaming: boolean;
    content: string;
    onUpdateTaxonomy?: (newContent: string) => void;  // Add this optional callback
  }