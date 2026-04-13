"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Added for better UX during PDF generation

// --- TypeScript Interfaces to enforce strict typing ---
interface Property {
    id: string;
    name: string;
}

interface ReportDetail {
    id: string;
    unit: string;
    renter: string;
    amountInKES: number;
    isPaid: boolean;
}

const formatKES = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0
    }).format(amount || 0);
};

export default function ReportsPage() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [selectedProperty, setSelectedProperty] = useState<string>("");
    const [month, setMonth] = useState(currentMonth.toString());
    const [year, setYear] = useState(currentYear.toString());
    const [isDownloading, setIsDownloading] = useState(false); // Track PDF generation state

    // 1. Fetch Properties (Using React Query)
    const { data: properties = [] } = useQuery({
        queryKey: ["properties"],
        queryFn: async () => {
            const res = await api.get("/properties");
            return res.data.data;
        },
    });

    // Auto-select the first property once they load
    useEffect(() => {
        if (properties.length > 0 && !selectedProperty) {
            setSelectedProperty(properties[0].id);
        }
    }, [properties, selectedProperty]);

    // 2. Fetch the Specific Income Report (Using React Query)
    const { data: reportData, isLoading: isLoadingReport } = useQuery({
        queryKey: ["reports", "income", selectedProperty, month, year],
        queryFn: async () => {
            const res = await api.get(`/reports/income?propertyId=${selectedProperty}&month=${month}&year=${year}`);
            return res.data.data;
        },
        enabled: !!selectedProperty, // Wait until a property is actually selected before fetching!
    });

    // 3. Phase 3 PDF Generation trigger
    const handleDownloadPdf = async () => {
        try {
            setIsDownloading(true);

            // Format month to match backend expectation (e.g., "2026-03")
            const formattedMonth = `${year}-${month.padStart(2, '0')}`;

            // Call the Phase 3 backend endpoint
            const res = await api.get(`/reports/statement/download?month=${formattedMonth}&propertyId=${selectedProperty}`, {
                responseType: 'blob', // Critical for handling binary file data
            });

            // Trigger the browser download
            const url = window.URL.createObjectURL(res.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Statement_${formattedMonth}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Statement generated and downloaded successfully!");
        } catch (error) {
            console.error("PDF Download Error:", error);
            toast.error("Failed to generate PDF statement. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">Generate monthly statements per property.</p>
                </div>
                {/* Updated Button to use backend PDF generation */}
                <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={!reportData || isDownloading}
                >
                    {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {isDownloading ? "Generating..." : "Export PDF"}
                </Button>
            </div>

            <div className="flex gap-4 p-4 bg-white border rounded-md">
                <div className="w-1/3">
                    <label className="text-sm font-medium mb-1 block">Property</label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Property" />
                        </SelectTrigger>
                        <SelectContent>
                            {properties.map((p: Property) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-1/3">
                    <label className="text-sm font-medium mb-1 block">Month</label>
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <SelectItem key={m} value={m.toString()}>
                                    {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-1/3">
                    <label className="text-sm font-medium mb-1 block">Year</label>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[currentYear, currentYear - 1].map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoadingReport ? (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Fetching report...
                </div>
            ) : reportData ? (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Expected Income</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatKES(reportData.summary.expectedIncomeInKES)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Collected Income</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-700">{formatKES(reportData.summary.collectedIncomeInKES)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Collection Rate: {reportData.summary.collectionRate}%</p>
                            </CardContent>
                        </Card>
                        <Card className="border-red-100 bg-red-50/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-red-800">Rent Arrears</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-700">{formatKES(reportData.summary.arrearsInKES)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-md border bg-white mt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Tenant</TableHead>
                                    <TableHead className="text-right">Amount Billed</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.details.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No billing data for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reportData.details.map((item: ReportDetail) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.unit}</TableCell>
                                            <TableCell>{item.renter}</TableCell>
                                            <TableCell className="text-right font-medium">{formatKES(item.amountInKES)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={item.isPaid ? "default" : "destructive"}
                                                    className={item.isPaid ? "bg-green-100 text-green-800 border-green-200" : ""}
                                                >
                                                    {item.isPaid ? "PAID" : "ARREARS"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            ) : null}
        </div>
    );
}