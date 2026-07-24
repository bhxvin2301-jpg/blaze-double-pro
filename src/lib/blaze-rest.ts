'use client';

import { DoubleResult, ROLL_TO_COLOR } from './types';

const API_BASE = 'https://blaze.com/api/roulette_games/recent';

export async function fetchHistory(limit: number = 30): Promise<DoubleResult[]> {
  try {
    const response = await fetch(API_BASE, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://blaze.com',
        'Referer': 'https://blaze.com/',
      },
    });
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
