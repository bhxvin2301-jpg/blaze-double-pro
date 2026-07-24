'use client';

import { DoubleResult, DoubleColor } from './types';

export class MarkovChain {
  private matrix: Record<string, Record<string, number>> = {
    vermelho: { vermelho: 0, preto: 0, branco: 0 },
    preto: { vermelho: 0, preto: 0, branco: 0 },
    branco: { vermelho: 0, preto: 0, branco: 0 },
  };
  private total: Record<string, number> = { vermelho: 0, preto: 0, branco: 0 };

  train(historico: DoubleResult[]) {
    for (const from of ['vermelho', 'preto', 'branco']) {
      for (const to of ['vermelho', 'preto', 'branco']) this.matrix[from][to] = 0;
      this.total[from] = 0;
    }
    for (let i = 1; i < historico.length; i++) {
      const from = historico[i-1].color;
      const to = historico[i].color;
      if (this.matrix[from]) { this.matrix[from][to]++; this.total[from]++; }
    }
  }

  predictNext(ultimaCor: DoubleColor): { cor: DoubleColor; prob: number } {
    if (!this.total[ultimaCor] || this.total[ultimaCor] === 0)
      return { cor: Math.random() > 0.5 ? 'vermelho' : 'preto', prob: 0.5 };
    let maxCount = 0;
    let bestCor: DoubleColor = 'preto';
    for (const [cor, count] of Object.entries(this.matrix[ultimaCor])) {
      if (count > maxCount) { maxCount = count; bestCor = cor as DoubleColor; }
    }
    return { cor: bestCor, prob: maxCount / this.total[ultimaCor] };
  }

  getMatrix(): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};
    for (const [from, trans] of Object.entries(this.matrix)) {
      result[from] = {};
      for (const [to, count] of Object.entries(trans))
        result[from][to] = this.total[from] > 0 ? count / this.total[from] : 0;
    }
    return result;
  }
}
