'use client';

import { DoubleResult, DoubleColor, PadraoResult } from './types';

function detectStreak(h: DoubleResult[]): PadraoResult {
  if (h.length < 3) return { nome: 'Streak', detectado: false, confianca: 0, sugestao: null, descricao: 'Insuficiente' };
  const ultimos = h.slice(-5);
  let streak = 1;
  const cor = ultimos[ultimos.length - 1].color;
  for (let i = ultimos.length - 2; i >= 0; i--) { if (ultimos[i].color === cor) streak++; else break; }
  if (streak >= 3) {
    const probQuebra = Math.min(0.5 + (streak - 3) * 0.05, 0.75);
    const corOp: DoubleColor = cor === 'vermelho' ? 'preto' : 'vermelho';
    return { nome: `Streak ${streak}x`, detectado: true, confianca: probQuebra, sugestao: probQuebra > 0.55 ? corOp : cor, descricao: `${streak}x ${cor}. Quebra: ${(probQuebra*100).toFixed(0)}%` };
  }
  return { nome: 'Streak', detectado: false, confianca: 0, sugestao: null, descricao: `Streak ${streak}` };
}

function detect2x2(h: DoubleResult[]): PadraoResult {
  if (h.length < 6) return { nome: '2x2', detectado: false, confianca: 0, sugestao: null, descricao: 'Insuficiente' };
  const r = h.slice(-8).map(x => x.color);
  for (let i = 0; i <= r.length - 4; i++) {
    if (r[i] === r[i+1] && r[i+2] === r[i+3] && r[i] !== r[i+2]) {
      if (i + 3 === r.length - 1) {
        return { nome: '2x2', detectado: true, confianca: 0.65, sugestao: r[i], descricao: `Próximo: ${r[i]}` };
      }
    }
  }
  return { nome: '2x2', detectado: false, confianca: 0, sugestao: null, descricao: 'Não detectado' };
}

function detectXadrez(h: DoubleResult[]): PadraoResult {
  if (h.length < 5) return { nome: 'Xadrez', detectado: false, confianca: 0, sugestao: null, descricao: 'Insuficiente' };
  const r = h.slice(-7).map(x => x.color);
  let alt = true;
  for (let i = 1; i < r.length; i++) { if (r[i] === r[i-1] || r[i] === 'branco' || r[i-1] === 'branco') { alt = false; break; } }
  if (alt && r.length >= 4) {
    const prox: DoubleColor = r[r.length-1] === 'vermelho' ? 'preto' : 'vermelho';
    return { nome: 'Xadrez', detectado: true, confianca: 0.60, sugestao: prox, descricao: `Próximo: ${prox}` };
  }
  return { nome: 'Xadrez', detectado: false, confianca: 0, sugestao: null, descricao: 'Não detectado' };
}

function detect422(h: DoubleResult[]): PadraoResult {
  if (h.length < 8) return { nome: '422', detectado: false, confianca: 0, sugestao: null, descricao: 'Insuficiente' };
  const r = h.slice(-10).map(x => x.color);
  for (let i = 0; i <= r.length - 8; i++) {
    const b1 = r.slice(i, i+4), b2 = r.slice(i+4, i+6), b3 = r.slice(i+6, i+8);
    if (b1.every(c => c === 'vermelho') && b2.every(c => c === 'preto') && b3.every(c => c === 'vermelho'))
      return { nome: '422', detectado: true, confianca: 0.70, sugestao: 'vermelho', descricao: '4V-2P-2V → V' };
    if (b1.every(c => c === 'preto') && b2.every(c => c === 'vermelho') && b3.every(c => c === 'preto'))
      return { nome: '422 (inv)', detectado: true, confianca: 0.70, sugestao: 'preto', descricao: '4P-2V-2P → P' };
  }
  return { nome: '422', detectado: false, confianca: 0, sugestao: null, descricao: 'Não detectado' };
}

function detect31(h: DoubleResult[]): PadraoResult {
  if (h.length < 4) return { nome: '31', detectado: false, confianca: 0, sugestao: null, descricao: 'Insuficiente' };
  const r = h.slice(-6).map(x => x.color);
  for (let i = 0; i <= r.length - 4; i++) {
    const t = r.slice(i, i+3), q = r[i+3];
    if (t.every(c => c === t[0]) && t[0] !== q && i + 4 < r.length) {
      if (r[i+4] === t[0]) {
        const prox: DoubleColor = t[0] === 'vermelho' ? 'vermelho' : 'preto';
        return { nome: '31', detectado: true, confianca: 0.72, sugestao: prox, descricao: `3-1-3 → ${prox}` };
      }
    }
  }
  return { nome: '31', detectado: false, confianca: 0, sugestao: null, descricao: 'Não detectado' };
}

function detectGemeos(h: DoubleResult[]): PadraoResult {
  if (h.length < 2) return { nome: 'Gêmeos', detectado: false, confianca: 0, sugestao: null, descricao: 'Insuficiente' };
  const u = h.slice(-2);
  if (u.length === 2 && u[0].value === u[1].value && u[0].value > 0) {
    const cor: DoubleColor = u[0].color === 'vermelho' ? 'preto' : 'vermelho';
    return { nome: 'Gêmeos', detectado: true, confianca: 0.50, sugestao: cor, descricao: `Nº ${u[0].value} repetido → ${cor}` };
  }
  return { nome: 'Gêmeos', detectado: false, confianca: 0, sugestao: null, descricao: 'Não detectado' };
}

function detectCompensacao(h: DoubleResult[]): PadraoResult {
  if (h.length < 20) return { nome: 'Compensação', detectado: false, confianca: 0, sugestao: null, descricao: 'Amostra < 20' };
  const r = h.slice(-20);
  const v = r.filter(x => x.color === 'vermelho').length;
  const p = r.filter(x => x.color === 'preto').length;
  const total = v + p;
  if (total === 0) return { nome: 'Compensação', detectado: false, confianca: 0, sugestao: null, descricao: 'Só brancos' };
  const pctV = v / total;
  if (Math.abs(pctV - 0.5) > 0.15) {
    const cor: DoubleColor = pctV > 0.5 ? 'preto' : 'vermelho';
    return { nome: 'Compensação', detectado: true, confianca: Math.min(Math.abs(pctV - 0.5) * 2, 0.75), sugestao: cor, descricao: `V${(pctV*100).toFixed(0)}% P${((1-pctV)*100).toFixed(0)}% → ${cor}` };
  }
  return { nome: 'Compensação', detectado: false, confianca: 0, sugestao: null, descricao: 'Equilibrado' };
}

function detectPosBranco(h: DoubleResult[]): PadraoResult {
  if (h.length < 5) return { nome: 'Pós-Branco', detectado: false, confianca: 0, sugestao: null, descricao: 'Insuficiente' };
  let idxB = -1;
  for (let i = h.length - 1; i >= 0; i--) { if (h[i].color === 'branco') { idxB = i; break; } }
  if (idxB === -1) return { nome: 'Pós-Branco', detectado: false, confianca: 0, sugestao: null, descricao: 'Sem branco recente' };
  if (idxB < h.length - 3) {
    const semBranco = h.slice(idxB + 1, idxB + 4).every(x => x.color !== 'branco');
    if (semBranco) return { nome: 'Pós-Branco', detectado: true, confianca: 0.15, sugestao: 'branco', descricao: 'Possibilidade de novo branco' };
  }
  return { nome: 'Pós-Branco', detectado: false, confianca: 0, sugestao: null, descricao: 'Normal' };
}

export function analisarTodosPadroes(historico: DoubleResult[]): PadraoResult[] {
  return [
    detectStreak(historico), detect2x2(historico), detectXadrez(historico),
    detect422(historico), detect31(historico), detectGemeos(historico),
    detectCompensacao(historico), detectPosBranco(historico),
  ];
}

export function consolidarPrevisao(historico: DoubleResult[]): {
  cor: DoubleColor; confianca: number; metodos_consenso: number; fatores: string[];
} {
  const padroes = analisarTodosPadroes(historico);
  const detectados = padroes.filter(p => p.detectado && p.sugestao !== null);
  if (detectados.length === 0) {
    const r = historico.slice(-10);
    const v = r.filter(x => x.color === 'vermelho').length;
    const p = r.filter(x => x.color === 'preto').length;
    const cor: DoubleColor = v > p ? 'vermelho' : 'preto';
    return { cor, confianca: 0.5 + Math.abs(v-p)/20, metodos_consenso: 0, fatores: ['frequência'] };
  }
  const scores: Record<string, { score: number; peso: number; fatores: string[] }> = {
    vermelho: { score: 0, peso: 0, fatores: [] },
    preto: { score: 0, peso: 0, fatores: [] },
    branco: { score: 0, peso: 0, fatores: [] },
  };
  for (const p of detectados) {
    if (p.sugestao && scores[p.sugestao]) {
      scores[p.sugestao].score += p.confianca * p.confianca;
      scores[p.sugestao].peso += p.confianca;
      scores[p.sugestao].fatores.push(p.nome);
    }
  }
  let melhorCor: DoubleColor = 'preto';
  let melhorScore = 0;
  for (const [cor, d] of Object.entries(scores)) {
    if (d.peso > 0) { const m = d.score / d.peso; if (m > melhorScore) { melhorScore = m; melhorCor = cor as DoubleColor; } }
  }
  const melhor = scores[melhorCor];
  return { cor: melhorCor, confianca: Math.min(melhor.peso / Math.max(detectados.length, 1), 0.85), metodos_consenso: detectados.length, fatores: melhor.fatores };
                             }
