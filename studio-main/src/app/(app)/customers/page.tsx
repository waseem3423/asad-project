
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
import { Users } from "lucide-react";
import { useEffect, useState } from "react";

type Customer = {
  id: string;
  ownerName: string;
  petName: string;
  petBreed: string;
  userId: string;
};

export default function CustomersPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "customers"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const customersData: Customer[] = [];
      querySnapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddCustomer = async () => {
    if (!ownerName || !petName || !petBreed || !user) {
      alert("Please fill out all fields.");
      return;
    }
    try {
      await addDoc(collection(db, "customers"), { 
        ownerName, 
        petName, 
        petBreed,
        userId: user.uid 
      });
      setOwnerName("");
      setPetName("");
      setPetBreed("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding customer: ", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
              <DialogDescription>
                Add a new customer and their pet's details. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ownerName" className="text-right">
                  Owner Name
                </Label>
                <Input 
                  id="ownerName" 
                  value={ownerName} 
                  onChange={(e) => setOwnerName(e.target.value)} 
                  placeholder="e.g. Jane Doe" 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="petName" className="text-right">
                  Pet Name
                </Label>
                <Input 
                  id="petName" 
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="e.g. Buddy" 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="petBreed" className="text-right">
                  Pet Breed
                </Label>
                <Input 
                  id="petBreed" 
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  placeholder="e.g. Golden Retriever" 
                  className="col-span-3" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddCustomer}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>Maintain a customer list with ledger and track outstanding balances.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-center text-muted-foreground">No customers found. Add one to get started!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner Name</TableHead>
                  <TableHead>Pet Name</TableHead>
                  <TableHead>Pet Breed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.ownerName}</TableCell>
                    <TableCell>{customer.petName}</TableCell>
                    <TableCell>{customer.petBreed}</TableCell>
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
