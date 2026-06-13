// Swappable payment provider seam.
//
// COD and in-store pickup need no gateway. For online payment we go through a
// PaymentProvider so JazzCash / Easypaisa / a card gateway can be plugged in
// later without touching checkout. The "mock" provider below is a fully working
// test gateway. To add a real one, implement this interface and register it in
// ./index.ts — that's the only change required.

export type PaymentIntent = {
  orderRef: string;
  amount: number; // PKR
  customerName: string;
  customerEmail: string;
};

export type PaymentResult = {
  success: boolean;
  status: "paid" | "pending" | "failed";
  reference: string; // gateway transaction id
  provider: string;
  message?: string;
};

export interface PaymentProvider {
  readonly name: string;
  /** Charge / authorise a payment. Throwing is treated as a failed payment. */
  charge(intent: PaymentIntent): Promise<PaymentResult>;
}
