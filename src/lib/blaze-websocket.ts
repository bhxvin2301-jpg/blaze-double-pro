'use client';

import { DoubleTick, COLOR_MAP, DoubleResult } from './types';

type TickCallback = (tick: DoubleTick) => void;
type StatusCallback = (status: string) => void;

class BlazeWebSocketManager {
  private ws: WebSocket | null = null;
  private url = 'wss://api-v2.blaze.com/replication/?EIO=3&transport=websocket';
  private tickListeners: Set<TickCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnect = 50;
  private pingInterval: any = null;
  private subscribed = false;

  onTick(cb: TickCallback): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  onStatus(cb: StatusCallback): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private emitStatus(s: string) {
    this.statusListeners.forEach(cb => { try { cb(s); } catch {} });
  }

  private emitTick(t: DoubleTick) {
    this.tickListeners.forEach(cb => { try { cb(t); } catch {} });
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.emitStatus('conectando');
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emitStatus('conectado');
        this.subscribed = false;
        
        // Enviar subscribe Socket.IO
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('40');
            setTimeout(() => {
              if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send('42["cmd",{"id":"subscribe","payload":{"room":"double_v2"}}]');
                this.subscribed = true;
              }
            }, 500);
          }
        }, 300);
        
        this.startPing();
      };
      
      this.ws.onmessage = (event) => {
        const data = event.data as string;
        
        if (data === '2') { this.ws?.send('3'); return; }
        if (data === '3') { this.ws?.send('2'); return; }
        
        if (data.startsWith('42')) {
          try {
            const jsonStr = data.substring(2);
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed) && parsed[0] === 'double.tick' && parsed[1]) {
              this.emitTick(parsed[1] as DoubleTick);
            }
          } catch {}
        }
      };
      
      this.ws.onclose = () => {
        this.stopPing();
        this.emitStatus('desconectado');
        this.autoReconnect();
      };
      
      this.ws.onerror = () => {
        this.emitStatus('erro');
      };
      
    } catch (err) {
      this.emitStatus('erro_conexao');
      this.autoReconnect();
    }
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.ws?.send('2');
    }, 20000);
  }

  private stopPing() {
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
  }

  private autoReconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    this.stopPing();
    this.reconnectAttempts = this.maxReconnect;
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const blazeWS = new BlazeWebSocketManager();
export default blazeWS;
