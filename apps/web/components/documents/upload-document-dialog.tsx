"use client";

import { useState } from "react";
import { uploadDocument } from "@/lib/api/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function UploadDocumentDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState("NATIONAL_ID");

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a file to upload.");
            return;
        }

        // Must be less than 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB.");
            return;
        }

        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", category);

            await uploadDocument(formData);
            toast.success("Document uploaded successfully.");
            setFile(null);
            setOpen(false);
            onSuccess();
        } catch (error) {
            toast.error("Failed to upload document.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><UploadCloud className="mr-2 h-4 w-4" /> Upload Document</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>Securely store IDs, agreements, and receipts.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Document Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NATIONAL_ID">National ID / Passport</SelectItem>
                                <SelectItem value="AGREEMENT">Rental Agreement</SelectItem>
                                <SelectItem value="RECEIPT">Payment/Maintenance Receipt</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file">Select File</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-muted-foreground">Supported formats: PDF, JPG, PNG. Max size: 5MB.</p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading || !file}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isLoading ? "Uploading..." : "Upload File"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}