import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingDown,
} from "lucide-react";

export function meta() {
  return [{ title: "Pharmacy Inventory | MedFlow AI" }];
}

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "1", name: "Amoxicillin 500mg", code: "PH-AMX-500", category: "Antibiotic", stock: 1500, minStock: 200, price: 12.50 },
  { id: "2", name: "Atorvastatin 20mg", code: "PH-ATV-20", category: "Cardiology", stock: 800, minStock: 150, price: 45.00 },
  { id: "3", name: "Ibuprofen 400mg", code: "PH-IBU-400", category: "Analgesic", stock: 85, minStock: 100, price: 5.20 },
  { id: "4", name: "Metformin 850mg", code: "PH-MET-850", category: "Antidiabetic", stock: 650, minStock: 100, price: 18.00 },
  { id: "5", name: "Lisinopril 10mg", code: "PH-LIS-10", category: "Cardiology", stock: 0, minStock: 150, price: 22.00 },
  { id: "6", name: "Albuterol Inhaler", code: "PH-ALB-INH", category: "Respiratory", stock: 45, minStock: 50, price: 35.00 },
  { id: "7", name: "Omeprazole 20mg", code: "PH-OME-20", category: "Gastrointestinal", stock: 1200, minStock: 200, price: 8.50 },
];

export default function PharmacyInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [search, setSearch] = useState("");

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.code.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
          Out of Stock
        </Badge>
      );
    }
    if (stock < minStock) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
        In Stock
      </Badge>
    );
  };

  const handleRestock = (id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: item.stock + 500 } : item
      )
    );
  };

  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((i) => i.stock < i.minStock && i.stock > 0).length;
  const outOfStockCount = inventory.filter((i) => i.stock === 0).length;
  const totalValue = inventory.reduce((sum, item) => sum + item.stock * item.price, 0);

  return (
    <div className="space-y-6 mt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Pharmacy Inventory
          </h1>
          <p className="text-slate-500 font-medium">
            Monitor levels, category parameters, and restock options.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus size={16} /> Add New Medicine
        </Button>
      </div>

      {/* --- OVERVIEW CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Items</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalItems}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Low Stock Alerts</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{lowStockCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Out of Stock</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{outOfStockCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card shadow-sm rounded-xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Pill size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Inventory Value</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- INVENTORY LIST --- */}
      <Card className="card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg">Medicine Ledger</CardTitle>
            <CardDescription>
              Complete listing of medicines currently in stock or awaiting purchase.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              type="text"
              placeholder="Search by name, code or category..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 font-bold">Medicine Name</TableHead>
                <TableHead className="font-bold text-center">SKU Code</TableHead>
                <TableHead className="font-bold text-center">Category</TableHead>
                <TableHead className="font-bold text-center">Price</TableHead>
                <TableHead className="font-bold text-center">Stock Level</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-400 italic">
                    No items found matching your filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="pl-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-500">
                      {item.code}
                    </TableCell>
                    <TableCell className="text-center text-slate-600 dark:text-slate-400">
                      {item.category}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-900 dark:text-white">
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span className={item.stock < item.minStock ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-400"}>
                        {item.stock.toLocaleString()} units
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStockStatus(item.stock, item.minStock)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestock(item.id)}
                        className="text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950"
                      >
                        Restock +500
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
