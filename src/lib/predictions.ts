'use client';

import { DoubleResult, DoubleColor, PredictionResult, AnaliseEstado } from './types';
import { consolidarPrevisao, analisarTodosPadroes } from './patterns';
import { MarkovChain } from './markov';

const markov = new MarkovChain();

let adaptiveMemory = {
  pesos: { streak: 1.0, '2x2': 1.0, xadrez: 1.0, '422': 1.0, '31': 1.0, gemeos: 1.0, compensacao: 1.0, posbranco: 1.0, markov: 1.0, frequencia: 1.0 },
  total_previsoes: 0,
  total_acertos: 0,
};

function calcularEntropia(h: DoubleResult[], janela = 10): number {
  const r = h.slice(-janela);
  if (r.length === 0) return 1;
  const c: Record<string, number> = { vermelho: 0, preto: 0, branco: 0 };
  for (const x of r) c[x.color]++;
  let ent = 0;
  for (const count of Object.values(c)) { if (count > 0) { const p = count / r.length; ent -= p * Math.log2(p); } }
  return ent / Math.log2(3);
}

function detectarCiclos(h: DoubleResult[]): string[] {
  const ciclos: string[] = [];
  for (let tam = 3; tam <= 5; tam++) {
    if (h.length >= tam * 2) {
      const bloco = h.slice(-tam).map(x => x.color).join('');
      const ant = h.slice(-tam * 2, -tam).map(x => x.color).join('');
      if (bloco === ant) ciclos.push(`Ciclo-${tam}`);
    }
  }
  return ciclos;
}

export function gerarPrevisao(historico: DoubleResult[]): PredictionResult {
  if (historico.length < 3) {
    return { cor: Math.random() > 0.5 ? 'vermelho' : 'preto', confianca: 0.5, precisao_historica: 0, metodos_consenso: 0, fatores: ['poucos dados'], timestamp: Date.now() };
  }
  
  markov.train(historico);
  const padroesConsolidado = consolidarPrevisao(historico);
  const ultimaCor = historico[historico.length - 1].color;
  const markovPred = markov.predictNext(ultimaCor);
  const entropia = calcularEntropia(historico);
  const ciclos = detectarCiclos(historico);
  
  const r20 = historico.slice(-20);
  const v = r20.filter(x => x.color === 'vermelho').length;
  const p = r20.filter(x => x.color === 'preto').length;
  const t = v + p;
  const freqPred: DoubleColor = t > 0 ? (v / t > 0.5 ? 'vermelho' : 'preto') : 'preto';
  const freqConf = t > 0 ? Math.abs(v - p) / t : 0;
  
  const votos: Record<string, { peso: number; cor: DoubleColor }> = {};
  
  const pesoP = adaptiveMemory.pesos['streak'] || 1.0;
  votos['padroes'] = { peso: padroesConsolidado.metodos_consenso > 0 ? pesoP * padroesConsolidado.confianca * 2 : 0, cor: padroesConsolidado.cor };
  
  const pesoM = adaptiveMemory.pesos['markov'] || 1.0;
  votos['markov'] = { peso: markovPred.prob > 0.4 ? pesoM * markovPred.prob : 0, cor: markovPred.cor };
  
  const pesoF = adaptiveMemory.pesos['frequencia'] || 1.0;
  votos['frequencia'] = { peso: freqConf > 0.1 ? pesoF * freqConf : 0, cor: freqPred };
  
  if (entropia < 0.7) votos['entropia'] = { peso: (1 - entropia) * 0.8, cor: padroesConsolidado.cor };
  if (ciclos.length > 0) votos['ciclos'] = { peso: 0.6 * ciclos.length, cor: padroesConsolidado.cor };
  
  const scores: Record<string, number> = { vermelho: 0, preto: 0, branco: 0 };
  let pesoTotal = 0;
  const fatores: string[] = [];
  
  for (const [metodo, voto] of Object.entries(votos)) {
    if (voto.peso > 0 && scores[voto.cor] !== undefined) {
      scores[voto.cor] += voto.peso;
      pesoTotal += voto.peso;
      fatores.push(metodo);
    }
  }
  
  let finalCor: DoubleColor = 'preto';
  let finalScore = 0;
  for (const [cor, score] of Object.entries(scores)) { if (score > finalScore) { finalScore = score; finalCor = cor as DoubleColor; } }
  
  adaptiveMemory.total_previsoes++;
  
  return {
    cor: finalCor,
    confianca: pesoTotal > 0 ? Math.min(finalScore / pesoTotal, 0.92) : 0.5,
    precisao_historica: adaptiveMemory.total_previsoes > 0 ? adaptiveMemory.total_acertos / adaptiveMemory.total_previsoes : 0,
    metodos_consenso: fatores.length,
    fatores,
    timestamp: Date.now(),
  };
}

export function registrarFeedback(historico: DoubleResult[], previsao: PredictionResult) {
  if (historico.length === 0) return;
  const real = historico[historico.length - 1].color;
  const acertou = real === previsao.cor;
  if (acertou) adaptiveMemory.total_acertos++;
  
  for (const fator of previsao.fatores) {
    const key = fator as keyof typeof adaptiveMemory.pesos;
    if (adaptiveMemory.pesos[key] !== undefined) {
      if (acertou) adaptiveMemory.pesos[key] = Math.min(adaptiveMemory.pesos[key] * 1.05, 2.0);
      else adaptiveMemory.pesos[key] = Math.max(adaptiveMemory.pesos[key] * 0.95, 0.3);
    }
  }
}

export function gerarEstadoAnalise(historico: DoubleResult[]): AnaliseEstado | null {
  if (historico.length === 0) return null;
  const r = historico.slice(-10);
  const v = r.filter(x => x.color === 'vermelho').length;
  const p = r.filter(x => x.color === 'preto').length;
  
  const streakCor = historico[historico.length - 1].color;
  let streak = 1;
  for (let i = historico.length - 2; i >= 0; i--) { if (historico[i].color === streakCor) streak++; else break; }
  
  const tendencia = v > p + 1 ? 'vermelho' : p > v + 1 ? 'preto' : 'neutro';
  const forca = tendencia === 'neutro' ? 0 : Math.abs(v - p) / 10;
  const previsao = gerarPrevisao(historico);
  const ciclos = detectarCiclos(historico);
  const entropia = calcularEntropia(historico);
  
  markov.train(historico);
  
  return {
    ultimos_resultados: historico.slice(-15),
    tendencia_atual: tendencia as 'vermelho' | 'preto' | 'neutro',
    forca_tendencia: forca,
    streak_atual: streak,
    streak_cor: streakCor,
    ciclos_detectados: ciclos,
    recomendacao: previsao,
    marcov_matrix: Object.values(markov.getMatrix()).map(m => Object.values(m)),
    entropia,
    viés_detectado: Math.abs(v - p) > 4,
    timestamp: Date.now(),
  };
    }
