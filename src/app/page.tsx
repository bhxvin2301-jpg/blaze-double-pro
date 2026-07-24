'use client';

import { useEffect, useState, useRef } from 'react';
import { DoubleResult, COLOR_MAP } from '@/lib/types';
import { blazeWS } from '@/lib/blaze-websocket';
import { fetchHistory } from '@/lib/blaze-rest';
import { gerarPrevisao, gerarEstadoAnalise, registrarFeedback } from '@/lib/predictions';
import { analisarTodosPadroes } from '@/lib/patterns';

export default function Home() {
  const [historico, setHistorico] = useState<DoubleResult[]>([]);
  const [analise, setAnalise] = useState<any>(null);
  const [previsao, setPrevisao] = useState<any>(null);
  const [wsStatus, setWsStatus] = useState('conectando');
  const historicoRef = useRef<DoubleResult[]>([]);

  useEffect(() => {
    fetchHistory(50).then(data => {
      if (data.length > 0) {
        historicoRef.current = data;
        setHistorico(data);
        const estado = gerarEstadoAnalise(data);
        if (estado) setAnalise(estado);
        if (estado?.recomendacao) setPrevisao(estado.recomendacao);
      }
    });

    blazeWS.onTick((tick) => {
      const color = COLOR_MAP[tick.color] || 'branco';
      const novo: DoubleResult = { color, value: tick.roll, created_date: tick.created_at || new Date().toISOString() };
      historicoRef.current = [...historicoRef.current.slice(-99), novo];
      setHistorico(prev => [...prev.slice(-99), novo]);
      
      setTimeout(() => {
        const h = historicoRef.current;
        if (h.length >= 2) {
          const pred = gerarPrevisao(h.slice(0, -1));
          registrarFeedback(h, pred);
        }
        const estado = gerarEstadoAnalise(h);
        if (estado) setAnalise(estado);
        if (estado?.recomendacao) setPrevisao(estado.recomendacao);
      }, 50);
    });

    blazeWS.onStatus((s) => setWsStatus(s));
    blazeWS.connect();

    return () => { blazeWS.disconnect(); };
  }, []);

  const getBg = (cor: string) => {
    switch(cor) {
      case 'vermelho': return 'bg-red-600';
      case 'preto': return 'bg-gray-900';
      case 'branco': return 'bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500';
      default: return 'bg-gray-600';
    }
  };
  
  const getCorText = (cor: string) => {
    switch(cor) {
      case 'vermelho': return 'text-red-400';
      case 'preto': return 'text-gray-300';
      case 'branco': return 'text-yellow-300';
      default: return 'text-gray-400';
    }
  };

  const statusBadge = () => {
    if (wsStatus === 'conectado') return '🟢 AO VIVO';
    if (wsStatus === 'conectando') return '🟡 CONECTANDO';
    if (wsStatus === 'desconectado') return '🔴 DESCONECTADO';
    return '⚪ ' + wsStatus;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1f2937', background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #9333ea, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>B</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Blaze Double Pro</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Análise em tempo real</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 500 }}>{statusBadge()}</div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
        {/* Previsão Principal */}
        <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Previsão para Próxima Rodada</div>
          
          {previsao ? (
            <>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto', background: previsao.cor === 'vermelho' ? '#dc2626' : previsao.cor === 'preto' ? '#111827' : 'linear-gradient(135deg, #a855f7, #ec4899, #eab308)', border: '3px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                {previsao.cor === 'branco' ? '⭐' : previsao.cor === 'vermelho' ? '🔴' : '⚫'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '10px', color: previsao.cor === 'vermelho' ? '#f87171' : previsao.cor === 'preto' ? '#d1d5db' : '#fde047', textTransform: 'uppercase' }}>
                {previsao.cor}
              </div>
              
              {/* Barra confiança */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                  <span>Confiança</span>
                  <span>{(previsao.confianca * 100).toFixed(0)}%</span>
                </div>
                <div style={{ width: '100%', background: '#1f2937', borderRadius: '6px', height: '8px' }}>
                  <div style={{ height: '8px', borderRadius: '6px', background: previsao.confianca > 0.7 ? '#22c55e' : previsao.confianca > 0.5 ? '#eab308' : '#ef4444', width: `${previsao.confianca * 100}%`, transition: 'all 0.5s' }} />
                </div>
              </div>

              {/* Precisão histórica */}
              {previsao.precisao_historica > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                    <span>Precisão Histórica</span>
                    <span>{(previsao.precisao_historica * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ width: '100%', background: '#1f2937', borderRadius: '6px', height: '6px' }}>
                    <div style={{ height: '6px', borderRadius: '6px', background: '#3b82f6', width: `${Math.min(previsao.precisao_historica * 100, 100)}%`, transition: 'all 0.5s' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                {previsao.fatores.map((f: string, i: number) => (
                  <span key={i} style={{ padding: '2px 8px', background: '#1f2937', borderRadius: '12px', fontSize: '10px', color: '#9ca3af' }}>{f}</span>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px' }}>{previsao.metodos_consenso} método(s) em consenso</div>
            </>
          ) : (
            <div style={{ padding: '24px', color: '#6b7280' }}>⏳ Aguardando dados...</div>
          )}
        </div>

        {/* Cards de Estatísticas */}
        {analise && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: 'Tendência', value: analise.tendencia_atual.toUpperCase(), color: analise.tendencia_atual === 'vermelho' ? '#f87171' : analise.tendencia_atual === 'preto' ? '#d1d5db' : '#6b7280' },
              { label: 'Força', value: `${(analise.forca_tendencia * 100).toFixed(0)}%`, color: analise.forca_tendencia > 0.5 ? '#22c55e' : '#eab308' },
              { label: 'Streak', value: `${analise.streak_atual}x`, color: '#9ca3af' },
              { label: 'Entropia', value: analise.entropia.toFixed(3), color: analise.entropia < 0.7 ? '#22c55e' : analise.entropia < 1.0 ? '#eab308' : '#ef4444' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#111827', borderRadius: '10px', border: '1px solid #1f2937', padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Últimos Resultados */}
        <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Últimos Resultados</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {historico.slice(-20).reverse().map((r, i) => (
              <div key={i} style={{ width: '38px', height: '38px', borderRadius: '8px', background: r.color === 'vermelho' ? '#dc2626' : r.color === 'preto' ? '#1f2937' : 'linear-gradient(135deg, #a855f7, #ec4899)', border: '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>
                {r.color === 'branco' ? '⭐' : r.value}
              </div>
            ))}
            {historico.length === 0 && <div style={{ color: '#4b5563', fontSize: '13px', padding: '10px 0' }}>Aguardando resultados...</div>}
          </div>
        </div>

        {/* Padrões Detectados */}
        <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Padrões Detectados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analisarTodosPadroes(historico).filter((p: any) => p.detectado).map((p: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(31,41,55,0.5)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(55,65,81,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#22c55e' }}>✓</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.nome}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.descricao}</div>
                  </div>
                </div>
                {p.sugestao && (
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', background: p.sugestao === 'vermelho' ? '#dc2626' : p.sugestao === 'preto' ? '#374151' : 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff' }}>
                    {p.sugestao}
                  </span>
                )}
              </div>
            ))}
            {analisarTodosPadroes(historico).filter((p: any) => p.detectado).length === 0 && (
              <div style={{ color: '#4b5563', fontSize: '13px', padding: '8px 0' }}>Nenhum padrão claro no momento</div>
            )}
          </div>
        </div>

        {/* Matriz de Markov */}
        {analise && (
          <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Matriz de Transição (Markov)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#6b7280' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>De \ Para</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Vermelho</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Preto</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Branco</th>
                  </tr>
                </thead>
                <tbody>
                  {['vermelho', 'preto', 'branco'].map((from, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 500, color: from === 'vermelho' ? '#f87171' : from === 'preto' ? '#d1d5db' : '#fde047' }}>{from}</td>
                      {analise.marcov_matrix[i]?.map((prob: number, j: number) => (
                        <td key={j} style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <div style={{ width: '40px', background: '#1f2937', borderRadius: '6px', height: '6px' }}>
                              <div style={{ height: '6px', borderRadius: '6px', background: prob > 0.5 ? '#22c55e' : prob > 0.3 ? '#eab308' : '#4b5563', width: `${prob * 100}%` }} />
                            </div>
                            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{(prob * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#4b5563', padding: '16px 0 8px', borderTop: '1px solid rgba(31,41,55,0.5)' }}>
          Blaze Double Pro — Ferramenta de análise estatística educacional.<br />
          Toda aposta envolve risco. Jogue com responsabilidade. Proibido para menores de 18 anos.
        </div>
      </div>
    </div>
  );
  }
