import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://blaze.com/api/roulette_games/recent', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 0 },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Falha ao buscar dados' }, { status: 502 });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json({ error: 'Erro de conexão' }, { status: 502 });
  }
}
