
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
import { Truck } from "lucide-react";
import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  name: string;
  contact: string;
  userId: string;
};

export default function SuppliersPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "suppliers"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const suppliersData: Supplier[] = [];
      querySnapshot.forEach((doc) => {
        suppliersData.push({ id: doc.id, ...doc.data() } as Supplier);
      });
      setSuppliers(suppliersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddSupplier = async () => {
    if (!name || !contact || !user) {
      alert("Please fill out all fields.");
      return;
    }
    try {
      await addDoc(collection(db, "suppliers"), { 
        name, 
        contact,
        userId: user.uid
       });
      setName("");
      setContact("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding supplier: ", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Truck className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
              <DialogDescription>
                Add a new supplier to your list. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Vet Medico" 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-right">
                  Contact
                </Label>
                <Input 
                  id="contact" 
                  value={contact} 
                  onChange={(e) => setContact(e.target.value)} 
                  placeholder="e.g. 555-1234" 
                  className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddSupplier}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Supplier Management</CardTitle>
          <CardDescription>Maintain a supplier list for tracking purchases and payables.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <p>Loading suppliers...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-center text-muted-foreground">No suppliers found. Add one to get started!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact}</TableCell>
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
