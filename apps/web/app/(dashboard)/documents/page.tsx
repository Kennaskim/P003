"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/axios";
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Document {
    id: string;
    name: string;
    fileType: string;
    size: number;
    createdAt: string;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDocuments = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/files");
            if (response.data.success) {
                setDocuments(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDownload = async (id: string, fileName: string) => {
        try {
            // Ask the API for a temporary read-only link
            const response = await api.get(`/files/${id}/download`);
            if (response.data.success) {
                // Open the secure Cloudflare R2 link in a new tab
                window.open(response.data.data.url, "_blank");
            }
        } catch (error) {
            toast.error("Failed to securely fetch document.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground">
                        Manage leases, ID copies, and property files.
                    </p>
                </div>
                <UploadDocumentDialog onSuccess={fetchDocuments} />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>File Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading documents...</TableCell>
                            </TableRow>
                        ) : documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No documents uploaded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {doc.fileType.includes("image") ? (
                                            <ImageIcon className="h-4 w-4 text-blue-400" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-red-400" />
                                        )}
                                        <span className="truncate max-w-[250px]">{doc.name}</span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {doc.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(doc.createdAt).toLocaleDateString('en-KE')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.id, doc.name)}>
                                            <Download className="h-4 w-4 mr-2" /> View / Download
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}