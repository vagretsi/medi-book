import { PrismaClient } from "@prisma/client";
import DashboardController from "@/components/DashboardController";
import { ensureDaySlots, getDayBounds } from "@/lib/day-slots";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export default async function Page() {
  const today = new Date();
  const { startOfDay, endOfDay } = getDayBounds(today);

  await ensureDaySlots(prisma, today);

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
