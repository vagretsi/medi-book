import { PrismaClient } from "@prisma/client";
import { LogOut } from "lucide-react";
import { logout } from "./actions";
import DashboardController from "@/components/DashboardController";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

export default async function Page() {
  // Αρχικό φόρτωμα για τη σημερινή μέρα
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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto relative">
        {/* Κουμπί εξόδου (Absolute top right) */}
        <div className="absolute top-4 right-4 z-50 md:top-6 md:right-6">
          <form action={logout}>
             <button type="submit" className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <LogOut className="w-3 h-3" /> Έξοδος
            </button>
          </form>
        </div>

        <DashboardController initialData={initialResources} />
      </div>
    </div>
  );
}