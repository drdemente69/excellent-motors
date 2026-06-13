import { CheckoutForm } from "@/components/storefront/checkout/checkout-form";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Checkout
      </h1>
      <CheckoutForm />
    </div>
  );
}
