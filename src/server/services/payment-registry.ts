export type PaymentContext = { tx: any; payment: any };

export type PurposeHandler = {
  computeAmount: (purposeId: string, caller: any) => Promise<number>;
  onCaptured: (ctx: PaymentContext) => Promise<void>;
  onFailed: (ctx: PaymentContext) => Promise<void>;
  onRefunded: (ctx: PaymentContext & { refund: any }) => Promise<void>;
};

export const registry: Record<string, PurposeHandler> = {};

export function registerPurpose(purpose: string, handler: PurposeHandler) {
  registry[purpose] = handler;
}

