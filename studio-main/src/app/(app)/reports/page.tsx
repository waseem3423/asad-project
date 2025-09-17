
"use client"

import { useState, useEffect } from "react"
import type { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon, DollarSign, CreditCard, TrendingUp, Boxes, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore"
import { CSVLink } from "react-csv"
import { useAuth } from "@/hooks/use-auth"

type Invoice = {
  id: string;
  customer: string;
  amount: number;
  date: string;
  userId: string;
};

type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  userId: string;
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  salePrice: number;
  userId: string;
};

export default function ReportsPage() {
  const { settings, user } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);

  // CSV Headers
  const salesHeaders = [
    { label: "Customer", key: "customer" },
    { label: "Date", key: "date" },
    { label: "Amount", key: "amount" },
  ];
  const expensesHeaders = [
    { label: "Category", key: "category" },
    { label: "Date", key: "date" },
    { label: "Amount", key: "amount" },
  ];

  useEffect(() => {
    if (!user) return;
    // --- Inventory Snapshot ---
    const inventoryQuery = query(collection(db, "inventory"), where("userId", "==", user.uid));
    const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const inventoryData: InventoryItem[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventory(inventoryData);
      const inventoryValue = inventoryData.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.salePrice)), 0);
      setTotalInventoryValue(inventoryValue);
    }, (error) => console.error("Error fetching inventory:", error));

    return () => unsubInventory();
  }, [user]);

  useEffect(() => {
    if (!date?.from || !date?.to || !user) {
      setInvoices([]);
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const formattedFrom = format(date.from, 'yyyy-MM-dd');
    const formattedTo = format(date.to, 'yyyy-MM-dd');

    // --- Invoices within Date Range ---
    const invoicesQuery = query(
      collection(db, "invoices"),
      where("userId", "==", user.uid),
      where("date", ">=", formattedFrom),
      where("date", "<=", formattedTo)
    );
    const unsubInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      const invoicesData: Invoice[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(invoicesData);
      const sales = invoicesData.reduce((acc, curr) => acc + Number(curr.amount), 0);
      setTotalSales(sales);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching invoices:", error);
      setLoading(false);
    });

    // --- Expenses within Date Range ---
    const expensesQuery = query(
      collection(db, "expenses"),
      where("userId", "==", user.uid),
      where("date", ">=", formattedFrom),
      where("date", "<=", formattedTo)
    );
    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData: Expense[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(expensesData);
      const expensesTotal = expensesData.reduce((acc, curr) => acc + Number(curr.amount), 0);
      setTotalExpenses(expensesTotal);
       setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses:", error);
      setLoading(false);
    });
    
    return () => {
      unsubInvoices();
      unsubExpenses();
    };
  }, [date, user]); 

  useEffect(() => {
    setNetProfit(totalSales - totalExpenses);
  }, [totalSales, totalExpenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[250px] sm:w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
        </div>
      </div>

      {loading && !user ? (
        <p>Loading reports...</p>
      ) : (
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency}{totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Within selected date range</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency}{totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Within selected date range</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency}{netProfit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Within selected date range</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency}{totalInventoryValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Based on sale price</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Stock Value</CardTitle>
              <CardDescription>A complete breakdown of your current inventory's value.</CardDescription>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? <p className="text-muted-foreground">No items in inventory.</p> :
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Sale Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{settings.currency}{Number(item.salePrice).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold">{settings.currency}{(Number(item.quantity) * Number(item.salePrice)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>A list of the sales transactions in the selected date range.</CardDescription>
                </div>
                <CSVLink data={invoices} headers={salesHeaders} filename={"sales_report.csv"}>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </CSVLink>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? <p className="text-muted-foreground">No sales in this period.</p> :
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                       <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.customer}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell className="text-right">{settings.currency}{Number(invoice.amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Expenses</CardTitle>
                    <CardDescription>A list of logged expenses in the selected date range.</CardDescription>
                </div>
                 <CSVLink data={expenses} headers={expensesHeaders} filename={"expenses_report.csv"}>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </CSVLink>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? <p className="text-muted-foreground">No expenses in this period.</p> :
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell className="text-right">{settings.currency}{Number(expense.amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            </CardContent>
          </Card>
        </div>
      </>
      )}
    </div>
  );
}
