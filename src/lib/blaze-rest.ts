'use client';

import { DoubleResult, ROLL_TO_COLOR } from './types';

export async function fetchHistory(limit: number = 30): Promise<DoubleResult[]> {
  try {
    const response = await fetch('/api/history');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    return (data || []).map((item: any) => ({
      color: ROLL_TO_COLOR[item.roll] || 'branco',
      value: item.roll,
      created_date: item.created_at || new Date().toISOString(),
    }));
    
  } catch (error) {
    console.error('[BlazeREST] Erro:', error);
    return [];
  }
}
