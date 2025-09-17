
"use client";

import {
  ArrowUpRight,
  DollarSign,
  Menu,
  Package2,
  PawPrint,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { collection, onSnapshot, query, where, Timestamp, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subMonths, format, startOfMonth, endOfMonth, getMonth, getYear } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

type Customer = {
  id: string;
  ownerName: string;
  petName: string;
  petBreed: string;
  userId: string;
};

export default function DashboardPage() {
  const { settings, user } = useAuth();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // --- Invoices/Revenue ---
    const invoicesQuery = query(collection(db, "invoices"), where("userId", "==", user.uid));
    const unsubInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      const now = new Date();
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const thisMonthStart = startOfMonth(now);

      let currentMonthRevenue = 0;
      let lastMonthRevenue = 0;
      let total = 0;

      const monthlySales = Array(12).fill(0).map((_, i) => {
          const d = subMonths(now, i);
          return { name: format(d, 'MMM'), total: 0, year: getYear(d), month: getMonth(d) };
      }).reverse();

      snapshot.docs.forEach(doc => {
        const invoice = doc.data();
        // Ensure date is valid before processing
        if (!invoice.date) return;
        const invoiceDate = new Date(invoice.date);
        if (isNaN(invoiceDate.getTime())) return;
        
        total += Number(invoice.totalAmount);

        // Check for current and last month revenue
        if (invoiceDate >= thisMonthStart) {
          currentMonthRevenue += Number(invoice.totalAmount);
        } else if (invoiceDate >= lastMonthStart && invoiceDate <= lastMonthEnd) {
          lastMonthRevenue += Number(invoice.totalAmount);
        }
        
        // Aggregate sales for the chart
        const saleYear = getYear(invoiceDate);
        const saleMonth = getMonth(invoiceDate);
        const monthIndex = monthlySales.findIndex(m => m.year === saleYear && m.month === saleMonth);
        if (monthIndex !== -1) {
            monthlySales[monthIndex].total += Number(invoice.totalAmount);
        }
      });

      setTotalRevenue(total);
      setChartData(monthlySales);

      if (lastMonthRevenue > 0) {
        const change = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
        setRevenueChange(change);
      } else if (currentMonthRevenue > 0) {
        setRevenueChange(100); 
      } else {
        setRevenueChange(0)
      }
    });

    // --- Customers/Total Patients ---
    const customersQuery = query(collection(db, "customers"), where("userId", "==", user.uid));
    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
      setTotalPatients(snapshot.size);
    });

    // --- Recent Customers ---
    const recentCustomersQuery = query(collection(db, "customers"), where("userId", "==", user.uid), limit(5));
    const unsubRecentCustomers = onSnapshot(recentCustomersQuery, (snapshot) => {
      const customers: Customer[] = [];
      snapshot.forEach(doc => {
        customers.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setRecentCustomers(customers);
    });


    return () => {
      unsubInvoices();
      unsubCustomers();
      unsubRecentCustomers();
    };
  }, [user]);

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.currency}{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueChange >= 0 ? `+${revenueChange.toFixed(1)}%` : `${revenueChange.toFixed(1)}%`} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <PawPrint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Total customers registered
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Your sales performance over the last 12 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${settings.currency}${value}`}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>
                A few of your most recent customers.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/customers">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             {recentCustomers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    No customers added yet.
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Pet</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                            <TableCell>
                                <div className="font-medium">{customer.ownerName}</div>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{customer.petName}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                {customer.petBreed}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
