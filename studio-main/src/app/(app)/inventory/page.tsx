
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
import { Boxes } from "lucide-react";
import { useEffect, useState } from "react";
import { isBefore, addDays, parseISO } from "date-fns";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  salePrice: number;
  reorderLevel: number;
  expiryDate: string;
  userId: string;
};

export default function InventoryPage() {
  const { settings, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "inventory"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData: InventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setItems(itemsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddItem = async () => {
    if (!name || !quantity || !salePrice || !reorderLevel || !expiryDate || !user) {
      alert("Please fill out all fields.");
      return;
    }
    try {
      await addDoc(collection(db, "inventory"), { 
        name, 
        quantity: parseInt(quantity, 10),
        salePrice: parseFloat(salePrice),
        reorderLevel: parseInt(reorderLevel, 10),
        expiryDate,
        userId: user.uid
      });
      // Reset form
      setName("");
      setQuantity("");
      setSalePrice("");
      setReorderLevel("");
      setExpiryDate("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding inventory item: ", error);
    }
  };

  const isExpiringSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const expiry = parseISO(dateStr);
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return isBefore(expiry, thirtyDaysFromNow) && isBefore(new Date(), expiry);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Boxes className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>
                Add a new item to your inventory. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Item Name
                </Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amoxicillin" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity
                </Label>
                <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 50" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="salePrice" className="text-right">
                  Sale Price
                </Label>
                <Input id="salePrice" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="e.g. 15.99" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reorderLevel" className="text-right">
                  Reorder Level
                </Label>
                <Input id="reorderLevel" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} placeholder="e.g. 10" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">
                  Expiry Date
                </Label>
                <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddItem}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Tracking</CardTitle>
          <CardDescription>Monitor inventory with low stock alerts and expiry notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading inventory...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground">No items found. Add one to get started!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Stock Qty</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className={
                      item.quantity <= item.reorderLevel 
                      ? "bg-destructive/10" 
                      : isExpiringSoon(item.expiryDate) 
                      ? "bg-accent/20" 
                      : ""
                    }
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className={`text-right font-bold ${item.quantity <= item.reorderLevel ? "text-destructive" : ""}`}>
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">{settings.currency}{Number(item.salePrice).toFixed(2)}</TableCell>
                    <TableCell className={isExpiringSoon(item.expiryDate) ? "font-bold text-amber-700" : ""}>{item.expiryDate}</TableCell>
                    <TableCell className="text-right">{item.reorderLevel}</TableCell>
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
