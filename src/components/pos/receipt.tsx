import { formatPKR2, formatDateTime } from "@/lib/format";

export type ReceiptData = {
  saleNumber: string;
  date: string;
  cashierName: string;
  customerName?: string;
  items: { name: string; sku: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  payments: { method: string; amount: number }[];
  change: number;
};

// Thermal-printer-friendly receipt (80mm). Forced black-on-white so it prints
// correctly in either theme. The print stylesheet in globals.css isolates
// #receipt and sizes it for 80mm/58mm rolls.
export function Receipt({
  data,
  business,
}: {
  data: ReceiptData;
  business: { name: string; address: string; phone: string; ntn: string };
}) {
  return (
    <div
      id="receipt"
      className="mx-auto w-[300px] bg-white p-4 font-mono text-[12px] leading-tight text-black"
    >
      <div className="text-center">
        <p className="text-base font-bold uppercase tracking-wide">{business.name}</p>
        <p>{business.address}</p>
        <p>Tel: {business.phone}</p>
        <p>NTN: {business.ntn}</p>
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <div className="flex justify-between">
        <span>Receipt:</span>
        <span>{data.saleNumber}</span>
      </div>
      <div className="flex justify-between">
        <span>Date:</span>
        <span>{formatDateTime(data.date)}</span>
      </div>
      <div className="flex justify-between">
        <span>Cashier:</span>
        <span>{data.cashierName}</span>
      </div>
      {data.customerName && (
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{data.customerName}</span>
        </div>
      )}

      <div className="my-2 border-t border-dashed border-black" />

      <table className="w-full">
        <thead>
          <tr className="border-b border-dashed border-black text-left">
            <th className="font-normal">Item</th>
            <th className="font-normal text-center">Qty</th>
            <th className="font-normal text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((i, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-0.5">
                {i.name}
                <div className="text-[10px]">@ {formatPKR2(i.unitPrice)}</div>
              </td>
              <td className="text-center">{i.quantity}</td>
              <td className="text-right">{formatPKR2(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-2 border-t border-dashed border-black" />

      <Line label="Subtotal" value={formatPKR2(data.subtotal)} />
      <Line label="GST" value={formatPKR2(data.taxTotal)} />
      {data.discountTotal > 0 && <Line label="Discount" value={`- ${formatPKR2(data.discountTotal)}`} />}
      <div className="my-1 border-t border-dashed border-black" />
      <div className="flex justify-between text-sm font-bold">
        <span>TOTAL</span>
        <span>{formatPKR2(data.grandTotal)}</span>
      </div>

      <div className="my-2 border-t border-dashed border-black" />
      {data.payments.map((p, i) => (
        <Line key={i} label={`Paid (${p.method})`} value={formatPKR2(p.amount)} />
      ))}
      {data.change > 0 && <Line label="Change" value={formatPKR2(data.change)} />}

      <div className="my-2 border-t border-dashed border-black" />
      <p className="text-center">Thank you for your business!</p>
      <p className="text-center text-[10px]">Goods once sold are exchangeable within 7 days with receipt.</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
