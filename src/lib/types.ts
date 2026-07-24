export type DoubleColor = 'vermelho' | 'preto' | 'branco';

export interface DoubleTick {
  id: string;
  color: number;
  roll: number;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface DoubleResult {
  color: DoubleColor;
  value: number;
  created_date: string;
}

export interface PredictionResult {
  cor: DoubleColor;
  confianca: number;
  precisao_historica: number;
  metodos_consenso: number;
  fatores: string[];
  timestamp: number;
}

export interface PadraoResult {
  nome: string;
  detectado: boolean;
  confianca: number;
  sugestao: DoubleColor | null;
  descricao: string;
}

export interface AnaliseEstado {
  ultimos_resultados: DoubleResult[];
  tendencia_atual: 'vermelho' | 'preto' | 'neutro';
  forca_tendencia: number;
  streak_atual: number;
  streak_cor: DoubleColor | null;
  ciclos_detectados: string[];
  recomendacao: PredictionResult | null;
  marcov_matrix: number[][];
  entropia: number;
  viés_detectado: boolean;
  timestamp: number;
}

export const COLOR_MAP: Record<number, DoubleColor> = {
  0: 'branco', 1: 'vermelho', 2: 'preto',
};

export const ROLL_TO_COLOR: Record<number, DoubleColor> = {
  0: 'branco', 1: 'vermelho', 2: 'vermelho', 3: 'vermelho',
  4: 'vermelho', 5: 'vermelho', 6: 'vermelho', 7: 'vermelho',
  8: 'preto', 9: 'preto', 10: 'preto', 11: 'preto',
  12: 'preto', 13: 'preto', 14: 'preto',
};
