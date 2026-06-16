import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  console.log("🌱 Seeding database...")

  await prisma.orderNote.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.user.deleteMany()
  await prisma.client.deleteMany()
  await prisma.supplier.deleteMany()

  const adminHash = await bcrypt.hash("admin123", 10)
  const clientHash = await bcrypt.hash("client123", 10)

  await prisma.user.create({
    data: {
      email: "admin@idiglobal.com",
      name: "Admin IdentiGlobal",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  })

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        companyName: "Textiles Montserrat S.L.",
        contactName: "Maria Montserrat",
        email: "maria@textilesmontserrat.com",
        phone: "+34 932 100 200",
        address: "C/ Gran Via 45, Barcelona",
        conditions: "Pago a 30 días. Descuento 5% pedidos > 5000€",
      },
    }),
    prisma.client.create({
      data: {
        companyName: "Uniformes Corporativos SA",
        contactName: "Carlos Pérez",
        email: "carlos@unicorp.es",
        phone: "+34 912 300 400",
        address: "Av. Castellana 200, Madrid",
        conditions: "Pago a 60 días. Sin descuento",
      },
    }),
    prisma.client.create({
      data: {
        companyName: "Sport & Wear BCN",
        contactName: "Ana Rodríguez",
        email: "ana@sportwear.es",
        phone: "+34 933 500 600",
        address: "C/ Provença 88, Barcelona",
        conditions: "Pago contado. Descuento 10% pedidos > 10000€",
      },
    }),
  ])

  await prisma.user.create({
    data: {
      email: "maria@textilesmontserrat.com",
      name: "Maria Montserrat",
      passwordHash: clientHash,
      role: "CLIENT",
      clientId: clients[0].id,
    },
  })

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Textil Import Europa",
        contactEmail: "ventas@textilimport.eu",
        contactPhone: "+34 934 100 200",
        products: "Camisetas, Polos, Sudaderas, Hoodies",
        leadTimeDays: 10,
        priceTier: "ECONOMY",
        notes: "Especialistas en básicos. Stock permanente colores neutros.",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Premium Garment Solutions",
        contactEmail: "orders@premiumgarment.com",
        contactPhone: "+34 91 200 3000",
        products: "Uniformes corporativos, Ropa técnica, Bordados premium",
        leadTimeDays: 21,
        priceTier: "PREMIUM",
        notes: "Alta calidad. Mínimo 50 uds por referencia.",
      },
    }),
  ])

  await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: "IG-2025-001",
        status: "DELIVERED",
        clientId: clients[0].id,
        supplierId: suppliers[0].id,
        totalAmount: 3250.0,
        clientNotes: "Camisetas para evento empresa junio",
        items: {
          create: [
            {
              product: "Camiseta Manga Corta",
              description: "100% algodón 180g, logo bordado",
              quantity: 150,
              unitPrice: 12.5,
              total: 1875.0,
            },
            {
              product: "Polo Corporativo",
              description: "Piqué premium, logo impresión transfer",
              quantity: 50,
              unitPrice: 27.5,
              total: 1375.0,
            },
          ],
        },
        notes: {
          create: [
            { content: "Pedido confirmado. Producción iniciada el 15/05.", isInternal: true },
            { content: "Entregado el 10/06. Cliente muy satisfecho.", isInternal: true },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "IG-2025-002",
        status: "IN_PRODUCTION",
        clientId: clients[1].id,
        supplierId: suppliers[1].id,
        totalAmount: 8750.0,
        clientNotes: "Uniformes temporada otoño-invierno",
        items: {
          create: [
            { product: "Chaqueta Corporativa", description: "Softshell, logo bordado pecho", quantity: 100, unitPrice: 52.5, total: 5250.0 },
            { product: "Pantalón Trabajo", description: "Tejido técnico multibolsillos", quantity: 100, unitPrice: 35.0, total: 3500.0 },
          ],
        },
        notes: {
          create: [{ content: "En producción. Entrega prevista 20/07/2025.", isInternal: true }],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "IG-2025-003",
        status: "CONFIRMED",
        clientId: clients[2].id,
        supplierId: suppliers[0].id,
        totalAmount: 4200.0,
        clientNotes: "Colección verano equipo deportivo",
        items: {
          create: [
            { product: "Camiseta Técnica Running", description: "Tejido transpirable, serigrafía", quantity: 200, unitPrice: 14.0, total: 2800.0 },
            { product: "Short Deportivo", description: "Microfibra, logo bordado", quantity: 100, unitPrice: 14.0, total: 1400.0 },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "IG-2025-004",
        status: "QUOTE_SENT",
        clientId: clients[0].id,
        totalAmount: 1850.0,
        clientNotes: "Necesitamos sudaderas para el equipo de marketing",
        items: {
          create: [
            { product: "Sudadera con capucha", description: "280g, varios colores", quantity: 50, unitPrice: 25.0, total: 1250.0 },
            { product: "Camiseta Interior", description: "Base layer térmica", quantity: 50, unitPrice: 12.0, total: 600.0 },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: "IG-2025-005",
        status: "SHIPPED",
        clientId: clients[2].id,
        supplierId: suppliers[1].id,
        totalAmount: 6300.0,
        clientNotes: "Uniformes árbitros temporada 2025",
        items: {
          create: [
            { product: "Camiseta Árbitro", description: "Amarillo flúor, serigrafía oficial", quantity: 60, unitPrice: 35.0, total: 2100.0 },
            { product: "Pantalón Árbitro", description: "Negro, bolsillos laterales", quantity: 60, unitPrice: 30.0, total: 1800.0 },
            { product: "Chaqueta Polar", description: "Polar antipilling, logo bordado", quantity: 60, unitPrice: 40.0, total: 2400.0 },
          ],
        },
        notes: {
          create: [{ content: "Enviado por GLS. Tracking: GLS-789456123", isInternal: true }],
        },
      },
    }),
  ])

  console.log("✅ Creados: 5 pedidos, 3 clientes, 2 proveedores")
  console.log("📧 Admin: admin@idiglobal.com / admin123")
  console.log("📧 Cliente: maria@textilesmontserrat.com / client123")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
