
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { Banknote } from "lucide-react";
import { useEffect, useState } from "react";

type Expense = {
  id: string;
  category: string;
  amount: string;
  date: string;
  userId: string;
};

export default function ExpensesPage() {
  const { settings, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "expenses"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const expensesData: Expense[] = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() } as Expense);
      });
      setExpenses(expensesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddExpense = async () => {
    if (!category || !amount || !date || !user) {
      alert("Please fill out all fields.");
      return;
    }
    try {
      await addDoc(collection(db, "expenses"), { 
        category, 
        amount: parseFloat(amount), 
        date,
        userId: user.uid 
      });
      setCategory("");
      setAmount("");
      setDate("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding expense: ", error);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Banknote className="mr-2 h-4 w-4" />
              Log Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Expense</DialogTitle>
              <DialogDescription>
                Add a new expense record here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input 
                  id="category" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Supplies" 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input 
                  id="amount" 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="e.g. 100.00" 
                  className="col-span-3" 
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input 
                  id="date" 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="col-span-3" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddExpense}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Expense Recording</CardTitle>
          <CardDescription>Log expenses with category, amount, date, and notes.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <p className="text-center text-muted-foreground">No expenses found. Add one to get started!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="text-right">{settings.currency}{Number(expense.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
