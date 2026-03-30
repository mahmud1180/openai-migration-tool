import { NextRequest, NextResponse } from 'next/server';
import { migrateCode } from '../../../src/lib/migrator';

export async function POST(req: NextRequest) {
  const { code, target } = await req.json();

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  if (!target || !['responses-api', 'claude-api'].includes(target)) {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  }

  const result = migrateCode(code, target as 'responses-api' | 'claude-api');
  return NextResponse.json(result);
}
