import type { PaymentProvider } from "./provider";
import { MockPaymentProvider } from "./mock";

// Resolve the active provider from env. Add real providers here:
//   case "jazzcash": return new JazzCashProvider();
export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (name) {
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}

export type { PaymentProvider, PaymentIntent, PaymentResult } from "./provider";
