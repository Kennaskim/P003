"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

const formatKES = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);
};

export default function ReportsPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [reportData, setReportData] = useState<any>(null);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [month, setMonth] = useState(currentMonth.toString());
    const [year, setYear] = useState(currentYear.toString());

    useEffect(() => {
        api.get("/properties").then((res) => {
            setProperties(res.data.data);
            if (res.data.data.length > 0) setSelectedProperty(res.data.data[0].id);
        });
    }, []);

    useEffect(() => {
        if (selectedProperty) {
            api.get(`/reports/income?propertyId=${selectedProperty}&month=${month}&year=${year}`)
                .then(res => setReportData(res.data.data))
                .catch(err => console.error(err));
        }
    }, [selectedProperty, month, year]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">Generate monthly statements per property.</p>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
            </div>

            <div className="flex gap-4 p-4 bg-white border rounded-md">
                <div className="w-1/3">
                    <label className="text-sm font-medium mb-1 block">Property</label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                        <SelectTrigger><SelectValue placeholder="Select Property" /></SelectTrigger>
                        <SelectContent>
                            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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

            {reportData && (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Expected Income</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatKES(reportData.summary.expectedIncome)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Collected Income</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-700">{formatKES(reportData.summary.collectedIncome)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Collection Rate: {reportData.summary.collectionRate}%</p>
                            </CardContent>
                        </Card>
                        <Card className="border-red-100 bg-red-50/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-red-800">Rent Arrears</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-700">{formatKES(reportData.summary.arrears)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-md border bg-white">
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
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">No billing data for this period.</TableCell></TableRow>
                                ) : (
                                    reportData.details.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.unit}</TableCell>
                                            <TableCell>{item.renter}</TableCell>
                                            <TableCell className="text-right">{formatKES(item.amount)}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.isPaid ? "default" : "destructive"} className={item.isPaid ? "bg-green-100 text-green-800" : ""}>
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
            )}
        </div>
    );
}