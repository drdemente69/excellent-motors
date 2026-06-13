import type { PaymentProvider, PaymentIntent, PaymentResult } from "./provider";

// Fully working TEST gateway. Approves any amount and returns a reference.
// Swap PAYMENT_PROVIDER in .env to wire a real provider later.
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async charge(intent: PaymentIntent): Promise<PaymentResult> {
    // Simulate gateway latency.
    await new Promise((r) => setTimeout(r, 250));
    const reference = `MOCK-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      status: "paid",
      reference,
      provider: this.name,
      message: `Test payment of Rs ${intent.amount.toLocaleString("en-PK")} approved.`,
    };
  }
}
