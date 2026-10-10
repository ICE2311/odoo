const fs = require('fs');

let code = fs.readFileSync('src/server/services/payments.ts', 'utf8');
code = code.replace(
  /export async function capturePayment[\\s\\S]*?\\}\\n\\n/,
  `import { sql } from 'drizzle-orm';
export async function capturePayment(rzPaymentId: string, rzOrderId: string) {
  await db.transaction(async (tx) => {
    const [payment] = await tx.execute(
      sql\`SELECT * FROM payments WHERE razorpay_order_id = \${rzOrderId} FOR UPDATE\`
    ).then((res: any) => res.rows);

    if (!payment) throw new Error('Payment not found');
    if (payment.status === 'captured') return;

    await tx.update(payments).set({ status: 'captured', razorpayPaymentId: rzPaymentId }).where(eq(payments.id, payment.id));

    const handler = registry[payment.purpose];
    if (handler) {
      await handler.onCaptured({ tx, payment: { ...payment, status: 'captured', razorpayPaymentId: rzPaymentId } });
    }
  });
}
`
);
// fix duplicate imports if any
code = code.replace(/import \{ sql \} from 'drizzle-orm';\\nimport \{ sql \} from 'drizzle-orm';/g, "import { sql } from 'drizzle-orm';");
fs.writeFileSync('src/server/services/payments.ts', code);

let code2 = fs.readFileSync('src/server/services/refunds.ts', 'utf8');
code2 = code2.replace(
  /const \\[payment\\] = await tx\\.execute\\([\\s\\S]*?\\)\\.then\\(\\(res: any\\) => res\\.rows\\);/,
  `const [payment] = await tx.execute(
      sql\`SELECT * FROM payments WHERE id = \${paymentId} FOR UPDATE\`
    ).then((res: any) => res.rows);`
);
fs.writeFileSync('src/server/services/refunds.ts', code2);
