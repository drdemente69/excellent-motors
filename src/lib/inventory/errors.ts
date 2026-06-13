export class InsufficientStockError extends Error {
  readonly productId: string;
  readonly requested: number;
  readonly available: number;
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
    );
    this.name = "InsufficientStockError";
    this.productId = productId;
    this.requested = requested;
    this.available = available;
  }
}
