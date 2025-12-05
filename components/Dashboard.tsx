import React, { useEffect, useState, useMemo } from 'react';
import { getSales } from '../services/dataService';
import { SaleRecord } from '../types';
import { GlassCard } from './ui/GlassCard';
import { TrendingUp, Users, ShoppingBag, DollarSign, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format, startOfDay, subDays, isSameDay } from 'date-fns';

export const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);

  useEffect(() => {
    setSales(getSales().reverse()); // Show newest first
  }, []);

  const totalRevenue = sales.reduce((acc, s) => acc + s.totalBill, 0);
  const totalC2Sales = sales.filter(s => s.customerType === 'C2').length;

  // --- Chart Data Processing ---

  // 1. Line Chart: Revenue over time (Last 7 Days)
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: d,
        label: format(d, 'dd MMM'),
        revenue: 0,
        salesCount: 0
      };
    });

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const dayStat = last7Days.find(d => isSameDay(d.date, saleDate));
      if (dayStat) {
        dayStat.revenue += sale.totalBill;
        dayStat.salesCount += 1;
      }
    });

    return last7Days;
  }, [sales]);

  // 2. Pie Chart: Sales by Brand
  const pieData = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.brand) {
          brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
        }
      });
    });

    return Object.entries(brandCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales]);

  const COLORS = ['#06b6d4', '#f97316', '#8b5cf6', '#10b981', '#ef4444'];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          <p className="text-slate-400 mt-1">Overview of your shop's performance</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm text-slate-500">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <GlassCard className="relative overflow-hidden group border-cyan-500/20">
           <div className="relative z-10">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Sales</p>
                 <h3 className="text-3xl font-bold text-white mt-1">{sales.length}</h3>
               </div>
               <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                 <ShoppingBag size={20} />
               </div>
             </div>
           </div>
         </GlassCard>

         <GlassCard className="relative overflow-hidden group border-green-500/20">
           <div className="relative z-10">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Revenue</p>
                 <h3 className="text-3xl font-bold text-white mt-1">
                   ₹{totalRevenue.toLocaleString()}
                 </h3>
               </div>
               <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                 <DollarSign size={20} />
               </div>
             </div>
           </div>
         </GlassCard>

         <GlassCard className="relative overflow-hidden group border-orange-500/20">
           <div className="relative z-10">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Mechanic Sales</p>
                 <h3 className="text-3xl font-bold text-white mt-1">{totalC2Sales}</h3>
               </div>
               <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                 <Users size={20} />
               </div>
             </div>
           </div>
         </GlassCard>
         
         <GlassCard className="relative overflow-hidden group border-purple-500/20">
           <div className="relative z-10">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Avg. Sale Value</p>
                 <h3 className="text-3xl font-bold text-white mt-1">
                   ₹{sales.length > 0 ? Math.round(totalRevenue / sales.length).toLocaleString() : 0}
                 </h3>
               </div>
               <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                 <Activity size={20} />
               </div>
             </div>
           </div>
         </GlassCard>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 h-full">
          <GlassCard title="Revenue Trend (Last 7 Days)" className="h-full flex flex-col">
            <div className="flex-1 w-full min-h-0 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    tick={{fontSize: 12}} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{fontSize: 12}} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
                    itemStyle={{ color: '#06b6d4' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Brand Distribution */}
        <div className="lg:col-span-1 h-full">
          <GlassCard title="Sales by Brand" className="h-full flex flex-col">
             <div className="flex-1 w-full min-h-0 relative">
               {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
                    />
                  </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                   No sales data available
                 </div>
               )}
             </div>
             {/* Legend */}
             <div className="mt-4 grid grid-cols-2 gap-2">
               {pieData.slice(0, 4).map((entry, index) => (
                 <div key={entry.name} className="flex items-center text-xs text-slate-400">
                   <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <span className="truncate">{entry.name}</span>
                   <span className="ml-auto font-bold text-slate-300">{entry.value}</span>
                 </div>
               ))}
             </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <GlassCard title="Recent Transactions">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-white/5 text-slate-200">
              <tr>
                <th className="p-4 rounded-l-lg">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right rounded-r-lg">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sales.slice(0, 5).map(sale => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="p-4 flex flex-col">
                    <span className="text-white font-medium">{format(new Date(sale.date), 'dd MMM yyyy')}</span>
                    <span className="text-xs font-mono opacity-50">{sale.id.slice(0, 8)}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white group-hover:text-cyan-400 transition-colors">{sale.customerName}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      sale.customerType === 'C2' 
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    }`}>
                      {sale.customerType}
                    </span>
                  </td>
                  <td className="p-4 text-right text-white font-mono">₹{sale.totalBill.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <p>No sales recorded yet.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};