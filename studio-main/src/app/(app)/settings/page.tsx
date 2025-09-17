
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc, getDoc, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";

type AppUser = {
  id: string;
  email: string;
  role: UserRole;
};

type PaymentGatewaySettings = {
  easypaisaAccountNumber: string;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankIban: string;
};

type AppSettings = {
  appName: string;
  currency: string;
  paymentGateway: Partial<PaymentGatewaySettings>;
};

export default function SettingsPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [settings, setSettings] = useState<AppSettings>({ appName: "", currency: "", paymentGateway: {} });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData: AppUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as AppUser));
      setUsers(usersData);
      setLoadingUsers(false);
    }, (error) => {
      console.error("Error fetching users: ", error);
      setLoadingUsers(false);
      toast({
        variant: "destructive",
        title: "Failed to load users",
        description: "Could not retrieve the user list from the database.",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    const settingsDocRef = doc(db, "settings", "app");
    const getSettings = async () => {
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
           setSettings({
            appName: data.appName || '',
            currency: data.currency || '',
            paymentGateway: data.paymentGateway || {},
          });
        } else {
          console.log("No settings document found, using defaults.");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load settings",
          description: "Could not retrieve app settings.",
        });
      } finally {
        setLoadingSettings(false);
      }
    };
    getSettings();
  }, [toast]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, { role: newRole });
      toast({
        title: "Success",
        description: `User role has been updated to ${newRole}.`,
      });
    } catch (error) {
      console.error("Error updating role: ", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the user role.",
      });
    }
  };

  const handleSettingsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };
  
  const handlePaymentGatewayChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({
        ...prev,
        paymentGateway: {
            ...prev.paymentGateway,
            [id]: value
        }
    }));
  };

  const handleSettingsSave = async () => {
    setSavingSettings(true);
    const settingsDocRef = doc(db, "settings", "app");
    try {
      await setDoc(settingsDocRef, settings, { merge: true });
      toast({
        title: "Settings Saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save your settings.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    toast({ title: "Starting Export", description: "Fetching all data from the database. This may take a moment..." });

    try {
      const collectionsToExport = ["customers", "suppliers", "inventory", "invoices", "expenses", "users"];
      const backupData: { [key: string]: any[] } = {};

      for (const collectionName of collectionsToExport) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        backupData[collectionName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vettrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Export Successful", description: "Your data has been downloaded." });
    } catch (error) {
      console.error("Export failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during export.";
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: errorMessage,
      });
    } finally {
      setExporting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSettingsSave} disabled={savingSettings || loadingSettings}>
          {savingSettings ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage general application settings.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSettings ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Software Name</Label>
                  <Input
                    id="appName"
                    value={settings.appName}
                    onChange={handleSettingsChange}
                    placeholder="e.g. VetTrack"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Input
                    id="currency"
                    value={settings.currency}
                    onChange={handleSettingsChange}
                    placeholder="e.g. $, £, €"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Gateway Settings</CardTitle>
            <CardDescription>Configure your payment details for invoices.</CardDescription>
          </CardHeader>
          <CardContent>
              {loadingSettings ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="easypaisaAccountNumber">Easypaisa Account Number</Label>
                        <Input id="easypaisaAccountNumber" value={settings.paymentGateway.easypaisaAccountNumber || ''} onChange={handlePaymentGatewayChange} placeholder="e.g. 03001234567" />
                    </div>
                    <div className="space-y-2 border-t pt-4">
                        <Label>Bank Transfer Details</Label>
                        <Input id="bankName" value={settings.paymentGateway.bankName || ''} onChange={handlePaymentGatewayChange} placeholder="Bank Name" className="mb-2"/>
                        <Input id="bankAccountTitle" value={settings.paymentGateway.bankAccountTitle || ''} onChange={handlePaymentGatewayChange} placeholder="Account Title" className="mb-2"/>
                        <Input id="bankAccountNumber" value={settings.paymentGateway.bankAccountNumber || ''} onChange={handlePaymentGatewayChange} placeholder="Account Number" className="mb-2"/>
                        <Input id="bankIban" value={settings.paymentGateway.bankIban || ''} onChange={handlePaymentGatewayChange} placeholder="IBAN" />
                    </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>Export all your data for backup or import it into another instance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">Download a complete backup of all your data in a single JSON file. This includes customers, suppliers, inventory, invoices, and expenses.</p>
              <Button onClick={handleExportData} disabled={exporting}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export All Data to JSON'}
              </Button>
            </div>
            <div className="space-y-2 border-t pt-4">
              <Label>Restore Data</Label>
              <p className="text-sm text-muted-foreground">
                To restore data from a backup file, you must use the official Google Cloud Firestore import tool. This is the safest and most reliable method. Importing directly through the app is not supported to prevent accidental data loss.
              </p>
              <a href="https://firebase.google.com/docs/firestore/manage-data/export-import" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">View Import/Export Documentation</Button>
              </a>
            </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user roles and permissions for the application.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <p>Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[180px]">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="cashier">Cashier</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
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

