
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, doc, getDoc, where } from "firebase/firestore";
import { FilePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

type Invoice = {
  id: string;
  customerName: string;
  totalAmount: number;
  date: string;
  userId: string;
};

type Customer = {
  id: string;
  ownerName: string;
  userId: string;
};

type InventoryItem = {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  userId: string;
};

type InvoiceItem = {
  itemId: string;
  quantity: number;
  price: number;
};

export default function InvoicesPage() {
  const { settings, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(true);

  // Fetch Customers and Inventory for the form
  useEffect(() => {
    if (!user) return;
    const customersQuery = query(collection(db, "customers"), where("userId", "==", user.uid));
    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
      const customersData: Customer[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(customersData);
    });

    const inventoryQuery = query(collection(db, "inventory"), where("userId", "==", user.uid));
    const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const inventoryData: InventoryItem[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventory(inventoryData);
    });

    return () => {
      unsubCustomers();
      unsubInventory();
    };
  }, [user]);

  // Fetch Invoices for the list
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "invoices"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const invoicesData: Invoice[] = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const invoiceData = docSnap.data();
          let customerName = "N/A";
          if (invoiceData.customerId) {
            const customerRef = doc(db, "customers", invoiceData.customerId);
            const customerSnap = await getDoc(customerRef);
            if (customerSnap.exists()) {
              customerName = customerSnap.data().ownerName;
            }
          }
          return {
            id: docSnap.id,
            customerName: customerName,
            totalAmount: invoiceData.totalAmount,
            date: invoiceData.date,
          } as Invoice;
        })
      );
      setInvoices(invoicesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);
  
  const handleAddItem = () => {
    setInvoiceItems([...invoiceItems, { itemId: "", quantity: 1, price: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...invoiceItems];
    const item = newItems[index];
    
    if (field === "itemId") {
      const selectedItem = inventory.find(i => i.id === value);
      item.itemId = value as string;
      item.price = selectedItem ? selectedItem.salePrice : 0;
    } else if (field === 'quantity') {
       item.quantity = Number(value);
    }
    
    setInvoiceItems(newItems);
  };
  
  const handleRemoveItem = (index: number) => {
      const newItems = invoiceItems.filter((_, i) => i !== index);
      setInvoiceItems(newItems);
  };

  const calculateTotal = () => {
      return invoiceItems.reduce((acc, item) => acc + (item.quantity * item.price), 0).toFixed(2);
  }

  const handleAddInvoice = async () => {
    if (!selectedCustomer || invoiceItems.length === 0 || !date || !user) {
      alert("Please select a customer, add at least one item, and set a date.");
      return;
    }
    try {
      await addDoc(collection(db, "invoices"), { 
          customerId: selectedCustomer,
          items: invoiceItems,
          totalAmount: parseFloat(calculateTotal()),
          date,
          userId: user.uid
      });
      // Reset form
      setSelectedCustomer("");
      setInvoiceItems([]);
      setDate(new Date().toISOString().split('T')[0]);
      setOpen(false);
    } catch (error) {
      console.error("Error adding invoice: ", error);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <FilePlus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new invoice. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select onValueChange={setSelectedCustomer} value={selectedCustomer}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.ownerName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                  <Label>Invoice Items</Label>
                  <div className="space-y-2">
                      {invoiceItems.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-5">
                                <Select value={item.itemId} onValueChange={(value) => handleItemChange(index, 'itemId', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                                    <SelectContent>
                                        {inventory.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2">
                                <Input type="number" placeholder="Qty" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                              </div>
                              <div className="col-span-2">
                                <Input type="number" placeholder="Price" value={item.price} readOnly />
                              </div>
                              <div className="col-span-2 text-right font-medium">
                                {settings.currency}{(item.quantity * item.price).toFixed(2)}
                              </div>
                              <div className="col-span-1 text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                      <Trash2 className="h-4 w-4 text-destructive"/>
                                  </Button>
                              </div>
                          </div>
                      ))}
                  </div>
                  <Button variant="outline" onClick={handleAddItem}>Add Item</Button>
              </div>
              <div className="text-right text-xl font-bold mt-4">
                  Grand Total: {settings.currency}{calculateTotal()}
              </div>

            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddInvoice}>Save Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
          <CardDescription>Generate and manage vet invoices including sale, purchase and treatment/visit invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p className="text-center text-muted-foreground">No invoices found. Create one to get started!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.customerName}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="text-right">{settings.currency}{Number(invoice.totalAmount).toFixed(2)}</TableCell>
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
