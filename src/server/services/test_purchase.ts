import { registerPurpose } from './payment-registry';
import { recordEntry } from './ledger';

if (process.env.NODE_ENV !== 'production') {
  registerPurpose('test_purchase', {
    computeAmount: async () => 10000, // ₹100
    onCaptured: async ({ tx, payment }) => {
      await recordEntry(tx, {
        direction: 'in',
        amountPaise: payment.amountPaise || payment.amount_paise,
        category: 'test_income',
        method: 'razorpay',
        sourceType: 'test_purchase',
        sourceId: payment.id,
        description: 'Test purchase captured',
      });
    },
    onFailed: async () => {},
    onRefunded: async ({ tx, payment, refund }) => {
      await recordEntry(tx, {
        direction: 'out',
        amountPaise: refund.amountPaise || refund.amount_paise,
        category: 'refund',
        method: 'razorpay',
        sourceType: 'test_purchase_refund',
        sourceId: refund.id,
        description: 'Test purchase refunded',
      });
    }
  });
}
