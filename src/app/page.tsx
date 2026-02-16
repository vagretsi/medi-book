import { PrismaClient } from "@prisma/client";
import DashboardController from "@/components/DashboardController";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export default async function Page() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const initialResources = await prisma.resource.findMany({
    orderBy: { id: 'asc' },
    include: {
      appointments: {
        where: { date: { gte: startOfDay, lte: endOfDay } },
        orderBy: { date: "asc" },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
        <DashboardController initialData={initialResources} />
    </div>
  );
}
