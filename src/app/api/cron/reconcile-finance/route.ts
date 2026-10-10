import { reconcile } from '@/server/data/admin/finance';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const mismatches = await reconcile(true);
  
  if (mismatches.length > 0) {
    console.error("Finance Reconciliation Mismatches found:", mismatches);
    // In a real app we might send an email to admins here
  }

  return new Response(JSON.stringify({ ok: true, mismatches }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
