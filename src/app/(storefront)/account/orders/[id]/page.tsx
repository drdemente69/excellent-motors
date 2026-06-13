import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getOrderById } from "@/lib/queries/orders";
import { OrderDetails } from "@/components/storefront/order-details";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order details" };

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  // Authorisation: the order must belong to this user.
  const owner = await prisma.order.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!owner) notFound();
  if (owner.userId !== user.id) redirect("/forbidden");

  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>
      <OrderDetails order={order} />
    </div>
  );
}
