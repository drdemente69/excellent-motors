import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

// ── Catalogue source data — car modification & styling ───────────────────────

const categories = [
  { name: "Body Kits", slug: "body-kits", icon: "CarFront", description: "Wide-body kits, bumpers, lips and fenders." },
  { name: "Spoilers & Aero", slug: "aero", icon: "Wind", description: "GT wings, diffusers, canards and splitters." },
  { name: "Wheels & Suspension", slug: "wheels", icon: "CircleDot", description: "Alloys, coilovers, lowering springs and spacers." },
  { name: "Seats & Interior", slug: "seats", icon: "Armchair", description: "Bucket seats, leather poshish and trims." },
  { name: "Infotainment", slug: "infotainment", icon: "MonitorSmartphone", description: "Android/CarPlay head units, screens and cameras." },
  { name: "Sound Systems", slug: "audio", icon: "Volume2", description: "Speakers, subs, amps and damping." },
  { name: "Lighting", slug: "lighting", icon: "Lightbulb", description: "LED & HID kits, sequential tails and ambient." },
  { name: "Styling & Accessories", slug: "styling", icon: "Sparkles", description: "Wraps, steering wheels, shifters and trim." },
];

const brands = [
  { name: "Liberty Walk", slug: "liberty-walk", country: "Japan" },
  { name: "Rocket Bunny", slug: "rocket-bunny", country: "Japan" },
  { name: "Mansory", slug: "mansory", country: "Germany" },
  { name: "BBS", slug: "bbs", country: "Germany" },
  { name: "Enkei", slug: "enkei", country: "Japan" },
  { name: "Work Wheels", slug: "work-wheels", country: "Japan" },
  { name: "Recaro", slug: "recaro", country: "Germany" },
  { name: "Sparco", slug: "sparco", country: "Italy" },
  { name: "Pioneer", slug: "pioneer", country: "Japan" },
  { name: "JBL", slug: "jbl", country: "USA" },
  { name: "Alpine", slug: "alpine", country: "Japan" },
  { name: "OSRAM", slug: "osram", country: "Germany" },
  { name: "Momo", slug: "momo", country: "Italy" },
  { name: "APR", slug: "apr", country: "USA" },
];

// Mix of Pakistan-popular tuners' cars + enthusiast platforms.
const vehicles = [
  { make: "Honda", model: "Civic", yearStart: 2016, yearEnd: 2021, variant: "FK/FC" },
  { make: "Honda", model: "Civic", yearStart: 2022, yearEnd: 2024, variant: "11th Gen" },
  { make: "Toyota", model: "Corolla", yearStart: 2014, yearEnd: 2020, variant: "1.8" },
  { make: "Honda", model: "City", yearStart: 2021, yearEnd: 2024, variant: "GN" },
  { make: "Suzuki", model: "Swift", yearStart: 2022, yearEnd: 2024, variant: "1.2" },
  { make: "Toyota", model: "Supra", yearStart: 2019, yearEnd: 2024, variant: "A90" },
  { make: "Nissan", model: "GT-R", yearStart: 2017, yearEnd: 2024, variant: "R35" },
  { make: "Porsche", model: "911", yearStart: 2019, yearEnd: 2024, variant: "992" },
  { make: "BMW", model: "3 Series", yearStart: 2019, yearEnd: 2024, variant: "G20" },
  { make: "Audi", model: "A4", yearStart: 2017, yearEnd: 2023, variant: "B9" },
];

type Seedable = {
  name: string;
  category: string;
  brand: string;
  partNumber: string;
  oem?: string;
  price: number;
  cost: number;
  stock: number;
  reorder?: number;
  featured?: boolean;
  short: string;
  fits?: string[];
};

const products: Seedable[] = [
  // Body Kits
  { name: "Liberty Walk Wide-Body Kit", category: "body-kits", brand: "liberty-walk", partNumber: "LBWK-CV-01", price: 285000, cost: 215000, stock: 6, reorder: 2, featured: true, short: "Full bolt-on wide-body conversion with rivets.", fits: ["Honda Civic", "Nissan GT-R"] },
  { name: "Rocket Bunny Fender Flare Set", category: "body-kits", brand: "rocket-bunny", partNumber: "RB-FF-220", price: 96000, cost: 68000, stock: 10, featured: true, short: "Aggressive over-fenders, FRP construction.", fits: ["Toyota Corolla", "Honda Civic"] },
  { name: "Carbon Fiber Front Lip Spoiler", category: "body-kits", brand: "apr", partNumber: "APR-FL-118", price: 42000, cost: 29000, stock: 18, short: "2x2 twill carbon, OE-fit front lip.", fits: ["Honda Civic", "Audi A4"] },
  { name: "Side Skirt Extension Set", category: "body-kits", brand: "apr", partNumber: "APR-SS-204", price: 28000, cost: 19000, stock: 22, short: "Lowers the visual ride height.", fits: ["Honda City", "Toyota Corolla"] },
  { name: "Mansory Carbon Bonnet", category: "body-kits", brand: "mansory", partNumber: "MAN-BN-09", price: 165000, cost: 124000, stock: 4, reorder: 2, short: "Vented carbon hood, lightweight.", fits: ["Porsche 911", "BMW 3 Series"] },
  { name: "Front Bumper Canard Kit", category: "body-kits", brand: "apr", partNumber: "APR-CN-77", price: 16500, cost: 10800, stock: 30, short: "4-piece carbon canards.", fits: ["Honda Civic"] },

  // Spoilers & Aero
  { name: "APR GT-250 Adjustable Wing", category: "aero", brand: "apr", partNumber: "APR-GT250", price: 88000, cost: 63000, stock: 9, featured: true, short: "67\" adjustable carbon GT wing.", fits: ["Toyota Supra", "Nissan GT-R"] },
  { name: "Ducktail Boot Spoiler", category: "aero", brand: "rocket-bunny", partNumber: "RB-DT-12", price: 24000, cost: 16000, stock: 26, short: "Subtle ducktail lip, paint-ready.", fits: ["Honda Civic", "BMW 3 Series"] },
  { name: "Carbon Rear Diffuser", category: "aero", brand: "apr", partNumber: "APR-DF-330", price: 54000, cost: 38000, stock: 12, featured: true, short: "Multi-fin rear diffuser, real carbon.", fits: ["Porsche 911", "Audi A4"] },
  { name: "Roof Wing Extension", category: "aero", brand: "mansory", partNumber: "MAN-RW-04", price: 31000, cost: 21000, stock: 14, short: "Aero roof spoiler.", fits: ["Honda Civic"] },
  { name: "Front Splitter with Rods", category: "aero", brand: "apr", partNumber: "APR-SP-150", price: 47000, cost: 33000, stock: 11, short: "Adjustable splitter + support rods.", fits: ["Toyota Supra"] },

  // Wheels & Suspension
  { name: "BBS LM 18\" Forged Wheel", category: "wheels", brand: "bbs", partNumber: "BBS-LM-18", price: 78000, cost: 58000, stock: 16, featured: true, short: "Iconic forged mesh, per wheel.", fits: ["Porsche 911", "BMW 3 Series", "Audi A4"] },
  { name: "Enkei RPF1 17\" Wheel", category: "wheels", brand: "enkei", partNumber: "ENK-RPF1-17", price: 34000, cost: 24000, stock: 28, featured: true, short: "Legendary lightweight track wheel, per wheel.", fits: ["Honda Civic", "Suzuki Swift", "Toyota Corolla"] },
  { name: "Work Emotion CR 18\" Wheel", category: "wheels", brand: "work-wheels", partNumber: "WRK-CR-18", price: 62000, cost: 45000, stock: 12, short: "Deep-concave JDM classic, per wheel.", fits: ["Honda Civic", "Nissan GT-R"] },
  { name: "Coilover Suspension Kit", category: "wheels", brand: "apr", partNumber: "APR-COIL-32", price: 115000, cost: 86000, stock: 8, reorder: 3, featured: true, short: "32-way adjustable damping, full set.", fits: ["Honda Civic", "Toyota Corolla"] },
  { name: "Lowering Spring Set", category: "wheels", brand: "apr", partNumber: "APR-LS-20", price: 22000, cost: 14500, stock: 24, short: "~35mm drop, progressive rate.", fits: ["Honda City", "Suzuki Swift"] },
  { name: "Hub-Centric Wheel Spacers 20mm", category: "wheels", brand: "apr", partNumber: "APR-WS-20", price: 9500, cost: 5800, stock: 40, short: "Pair, with extended studs.", fits: ["BMW 3 Series", "Audi A4"] },

  // Seats & Interior
  { name: "Recaro Sportster CS Seat", category: "seats", brand: "recaro", partNumber: "REC-CS-01", price: 142000, cost: 108000, stock: 7, reorder: 2, featured: true, short: "Reclining bucket with side airbag.", fits: ["Honda Civic", "Toyota Supra"] },
  { name: "Sparco R100 Bucket Seat", category: "seats", brand: "sparco", partNumber: "SPC-R100", price: 58000, cost: 41000, stock: 12, short: "Fixed-back tubular frame seat.", fits: ["Honda Civic", "Suzuki Swift"] },
  { name: "Custom Leather Seat Covers (Poshish)", category: "seats", brand: "momo", partNumber: "MM-PSH-LX", price: 26000, cost: 16000, stock: 20, featured: true, short: "Tailored full-grain leather upholstery.", fits: ["Toyota Corolla", "Honda City"] },
  { name: "Alcantara Steering Wheel Wrap", category: "seats", brand: "momo", partNumber: "MM-ALC-22", price: 8500, cost: 5200, stock: 35, short: "Hand-stitched alcantara, grippy.", fits: ["Honda Civic", "BMW 3 Series"] },
  { name: "Carbon Interior Trim Kit", category: "seats", brand: "mansory", partNumber: "MAN-INT-7", price: 36000, cost: 25000, stock: 14, short: "Dash & console carbon overlays.", fits: ["Audi A4", "Porsche 911"] },
  { name: "Premium Dashboard Cover", category: "seats", brand: "momo", partNumber: "MM-DASH-01", price: 6500, cost: 3800, stock: 45, short: "Anti-glare suede dash mat.", fits: ["Toyota Corolla", "Suzuki Swift"] },

  // Infotainment
  { name: "Pioneer 9\" Android Auto Head Unit", category: "infotainment", brand: "pioneer", partNumber: "PIO-DMH-A9", price: 62000, cost: 45000, stock: 15, featured: true, short: "Wireless CarPlay & Android Auto, HD.", fits: ["Honda Civic", "Toyota Corolla", "Honda City"] },
  { name: "Alpine 11\" Floating Display", category: "infotainment", brand: "alpine", partNumber: "ALP-iLX-F11", price: 98000, cost: 73000, stock: 8, featured: true, short: "Tilting 11\" capacitive screen.", fits: ["Toyota Supra", "Honda Civic"] },
  { name: "Wireless CarPlay Adapter", category: "infotainment", brand: "pioneer", partNumber: "PIO-WCP-2", price: 11000, cost: 6800, stock: 50, short: "Converts wired CarPlay to wireless.", fits: ["BMW 3 Series", "Audi A4"] },
  { name: "HD Reverse Camera Kit", category: "infotainment", brand: "alpine", partNumber: "ALP-RVC-720", price: 9500, cost: 5500, stock: 38, short: "Night-vision guidelines camera.", fits: ["Honda City", "Suzuki Swift"] },
  { name: "Digital Instrument Cluster", category: "infotainment", brand: "alpine", partNumber: "ALP-DIC-12", price: 84000, cost: 62000, stock: 6, reorder: 2, short: "12.3\" virtual cockpit upgrade.", fits: ["Honda Civic"] },
  { name: "360° Surround View System", category: "infotainment", brand: "pioneer", partNumber: "PIO-360-4", price: 46000, cost: 33000, stock: 10, short: "4-camera bird's-eye view kit.", fits: ["Toyota Corolla"] },

  // Sound Systems
  { name: "JBL Stadium GTO 6.5\" Components", category: "audio", brand: "jbl", partNumber: "JBL-GTO6C", price: 28000, cost: 19000, stock: 22, featured: true, short: "Component speakers with crossovers.", fits: ["Honda Civic", "Toyota Corolla"] },
  { name: "Pioneer 12\" Subwoofer", category: "audio", brand: "pioneer", partNumber: "PIO-TS-W12", price: 21000, cost: 14000, stock: 18, featured: true, short: "1400W champion-series sub.", fits: ["Honda City", "Suzuki Swift"] },
  { name: "Alpine 4-Channel Amplifier 800W", category: "audio", brand: "alpine", partNumber: "ALP-MRV-F300", price: 34000, cost: 24000, stock: 14, short: "Compact class-D 4-channel amp.", fits: ["Honda Civic"] },
  { name: "Sound Damping Mat (4 sheets)", category: "audio", brand: "jbl", partNumber: "JBL-SDM-4", price: 7500, cost: 4200, stock: 40, short: "Butyl deadening for doors/boot.", fits: ["Toyota Corolla", "Honda City"] },
  { name: "JBL Tweeter Set", category: "audio", brand: "jbl", partNumber: "JBL-TW-25", price: 9000, cost: 5400, stock: 30, short: "Soft-dome tweeters, surface/flush.", fits: ["Suzuki Swift"] },
  { name: "Bass Knob Remote Controller", category: "audio", brand: "alpine", partNumber: "ALP-RBX-8", price: 3500, cost: 1900, stock: 55, short: "Dash-mount bass level control." },

  // Lighting
  { name: "OSRAM LED Headlight Conversion", category: "lighting", brand: "osram", partNumber: "OSR-LEDHL-H4", price: 14500, cost: 9000, stock: 26, featured: true, short: "6000K plug-and-play LED bulbs (pair).", fits: ["Honda Civic", "Toyota Corolla", "Suzuki Swift"] },
  { name: "Sequential LED Tail Lights", category: "lighting", brand: "osram", partNumber: "OSR-SEQ-TL", price: 38000, cost: 27000, stock: 12, featured: true, short: "Dynamic indicators, smoked lens.", fits: ["Honda Civic", "Honda City"] },
  { name: "RGB Underglow Kit", category: "lighting", brand: "osram", partNumber: "OSR-UG-RGB", price: 12000, cost: 7200, stock: 24, short: "App-controlled underbody glow.", fits: ["Toyota Corolla", "Suzuki Swift"] },
  { name: "DRL Daytime Running Strip Set", category: "lighting", brand: "osram", partNumber: "OSR-DRL-2", price: 6500, cost: 3700, stock: 44, short: "Flexible switchback DRL strips.", fits: ["Honda City"] },
  { name: "HID Xenon Conversion Kit", category: "lighting", brand: "osram", partNumber: "OSR-HID-55", price: 11000, cost: 6800, stock: 20, short: "55W ballasts, 5000K (pair).", fits: ["Toyota Corolla"] },
  { name: "LED Ambient Interior Kit", category: "lighting", brand: "osram", partNumber: "OSR-AMB-16", price: 8500, cost: 4900, stock: 32, short: "16-colour fibre-optic ambient.", fits: ["Honda Civic", "BMW 3 Series"] },

  // Styling & Accessories
  { name: "3M Carbon Fiber Wrap (5m roll)", category: "styling", brand: "apr", partNumber: "APR-WRAP-5", price: 18000, cost: 11000, stock: 28, featured: true, short: "Air-release 2080 carbon vinyl.", fits: ["Honda Civic", "Toyota Supra"] },
  { name: "Momo Racing Steering Wheel", category: "styling", brand: "momo", partNumber: "MM-MOD78", price: 32000, cost: 22000, stock: 14, featured: true, short: "350mm suede competition wheel.", fits: ["Honda Civic", "Nissan GT-R"] },
  { name: "Short Shifter Kit", category: "styling", brand: "sparco", partNumber: "SPC-SSK-09", price: 16500, cost: 10500, stock: 18, short: "30% shorter throw, weighted knob.", fits: ["Suzuki Swift", "Honda City"] },
  { name: "Aluminium Pedal Cover Set", category: "styling", brand: "sparco", partNumber: "SPC-PED-3", price: 5500, cost: 3100, stock: 40, short: "Anti-slip drilled pedal covers.", fits: ["Toyota Corolla"] },
  { name: "Ceramic Window Tint Film", category: "styling", brand: "apr", partNumber: "APR-TINT-C", price: 22000, cost: 14000, stock: 16, short: "IR-rejecting ceramic, full car.", fits: ["Honda City", "BMW 3 Series"] },
  { name: "Quick-Release Steering Hub", category: "styling", brand: "momo", partNumber: "MM-QR-01", price: 14000, cost: 9000, stock: 20, short: "Snap-off boss kit, anti-theft.", fits: ["Honda Civic"] },
  { name: "Carbon Mirror Cover Set", category: "styling", brand: "mansory", partNumber: "MAN-MR-2", price: 17500, cost: 11500, stock: 22, short: "Replacement gloss carbon caps.", fits: ["Audi A4", "Porsche 911"] },
];

async function main() {
  console.log("🌱  Seeding Excellent Motors (modification catalogue)…");

  const settings: Record<string, unknown> = {
    businessName: "Excellent Motors",
    taxRatePct: 17,
    currency: "PKR",
    lowStockThreshold: 5,
    address: "Plot 14, Auto Spare Market, Bilal Gunj, Lahore, Pakistan",
    phone: "+92 300 1234567",
    email: "info@excellentmotors.pk",
    ntn: "4827193-6",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });
  }

  const warehouse = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    create: { name: "Main Store — Lahore", code: "MAIN", isDefault: true, address: settings.address as string },
    update: { isDefault: true },
  });
  const location = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: warehouse.id, code: "A1" } },
    create: { warehouseId: warehouse.id, name: "Aisle A / Rack 1", code: "A1" },
    update: {},
  });

  const brandMap = new Map<string, string>();
  for (const b of brands) {
    const row = await prisma.brand.upsert({ where: { slug: b.slug }, create: b, update: { country: b.country, name: b.name } });
    brandMap.set(b.slug, row.id);
  }

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: { description: c.description, icon: c.icon, name: c.name } });
    catMap.set(c.slug, row.id);
  }

  const vehicleRows = [] as { id: string; key: string }[];
  for (const v of vehicles) {
    const row = await prisma.vehicle.upsert({
      where: { make_model_yearStart_yearEnd_variant: { make: v.make, model: v.model, yearStart: v.yearStart, yearEnd: v.yearEnd, variant: v.variant } },
      create: v,
      update: {},
    });
    vehicleRows.push({ id: row.id, key: `${v.make} ${v.model}` });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const staff: { email: string; name: string; role: Prisma.UserCreateInput["role"] }[] = [
    { email: "admin@excellentmotors.pk", name: "Admin User", role: "admin" },
    { email: "cashier@excellentmotors.pk", name: "Cashier User", role: "cashier" },
    { email: "inventory@excellentmotors.pk", name: "Inventory Manager", role: "inventory_manager" },
    { email: "accountant@excellentmotors.pk", name: "Accountant User", role: "accountant" },
    { email: "hr@excellentmotors.pk", name: "HR User", role: "hr" },
  ];
  for (const u of staff) {
    await prisma.user.upsert({ where: { email: u.email }, create: { ...u, passwordHash }, update: { role: u.role, passwordHash } });
  }
  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    create: {
      email: "customer@example.com",
      name: "Ali Raza",
      role: "customer",
      passwordHash,
      customerProfile: { create: { phone: "+92 321 9876543", company: "Raza Customs" } },
      addresses: { create: { label: "Garage", line1: "Shop 22, Montgomery Road", city: "Lahore", province: "Punjab", postalCode: "54000", phone: "+92 321 9876543", isDefault: true } },
    },
    update: {},
  });

  await prisma.vendor.upsert({ where: { code: "VND-001" }, create: { code: "VND-001", name: "JDM Imports Pakistan", contactName: "Imran Sheikh", email: "sales@jdmimports.pk", phone: "+92 42 35678910", address: "Hall Road, Lahore", taxId: "1122334-5" }, update: {} });
  await prisma.vendor.upsert({ where: { code: "VND-002" }, create: { code: "VND-002", name: "Karachi Car Audio Centre", contactName: "Bilal Ahmed", email: "info@khiaudio.pk", phone: "+92 21 34567890", address: "Plaza Quarters, Karachi", taxId: "9988776-1" }, update: {} });

  await prisma.employee.upsert({
    where: { employeeCode: "EMP-001" },
    create: { employeeCode: "EMP-001", fullName: "Cashier User", position: "Senior Cashier", department: "Sales", baseSalary: 65000, joinedAt: new Date("2023-02-01"), email: "cashier@excellentmotors.pk" },
    update: {},
  });

  let sku = 1000;
  for (const p of products) {
    sku += 1;
    const skuCode = `EM-${sku}`;
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const product = await prisma.product.upsert({
      where: { sku: skuCode },
      create: {
        name: p.name,
        slug,
        sku: skuCode,
        partNumber: p.partNumber,
        oemNumber: p.oem,
        barcode: `860${sku}${Math.floor(Math.random() * 9000 + 1000)}`,
        shortDesc: p.short,
        description: `${p.short} Premium modification part supplied and fitted by Excellent Motors, with fitment support and warranty. Part number ${p.partNumber}.`,
        price: p.price,
        cost: p.cost,
        taxRatePct: 17,
        status: "active",
        isFeatured: p.featured ?? false,
        categoryId: catMap.get(p.category)!,
        brandId: brandMap.get(p.brand)!,
        images: { create: { url: `/placeholders/${p.category}.svg`, alt: p.name, isPrimary: true, sortOrder: 0 } },
      },
      update: { price: p.price, cost: p.cost, isFeatured: p.featured ?? false, categoryId: catMap.get(p.category)!, brandId: brandMap.get(p.brand)! },
    });

    await prisma.inventory.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
      create: { productId: product.id, warehouseId: warehouse.id, locationId: location.id, quantity: p.stock, reorderLevel: p.reorder ?? 5 },
      update: { quantity: p.stock, reorderLevel: p.reorder ?? 5 },
    });

    await prisma.stockMovement.create({
      data: { productId: product.id, warehouseId: warehouse.id, type: "initial", quantity: p.stock, reason: "Opening stock (seed)", reference: "SEED" },
    });

    if (p.fits) {
      for (const prefix of p.fits) {
        for (const m of vehicleRows.filter((v) => v.key === prefix)) {
          await prisma.productVehicleFitment.upsert({ where: { productId_vehicleId: { productId: product.id, vehicleId: m.id } }, create: { productId: product.id, vehicleId: m.id }, update: {} });
        }
      }
    }
  }

  const productCount = await prisma.product.count();
  console.log(`✅  Seed complete: ${productCount} products, ${brands.length} brands, ${vehicles.length} vehicles.`);
  console.log(`👤  Logins (password: ${DEMO_PASSWORD}): admin@excellentmotors.pk · cashier@excellentmotors.pk · customer@example.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
