"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UploadCloud, File, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadDocumentDialogProps {
    onSuccess: () => void;
}

export function UploadDocumentDialog({ onSuccess }: UploadDocumentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0] ?? null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB limit
        accept: {
            "application/pdf": [".pdf"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
        },
    });

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            // Step 1: Request Pre-signed URL from our NestJS API
            const urlResponse = await api.post("/files/request-upload", {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });

            const { presignedUrl, fileKey } = urlResponse.data.data;

            // Step 2: Upload directly to Cloudflare R2 using the pre-signed URL
            // We use standard axios here, NOT our api instance, because we don't want to attach our JWT to the Cloudflare request
            await axios.put(presignedUrl, file, {
                headers: {
                    "Content-Type": file.type,
                },
            });

            // Step 3: Confirm the upload with our API so it saves to the database
            await api.post("/files/confirm", {
                fileName: file.name,
                fileKey: fileKey,
                fileType: file.type,
                fileSize: file.size,
                entityType: "GENERAL", // You can expand this later to attach to specific units/renters
            });

            toast.success("Document uploaded successfully!");
            setFile(null);
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to upload document. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                        Upload signed rental agreements, ID copies, or property photos (Max 10MB).
                    </DialogDescription>
                </DialogHeader>

                {!file ? (
                    <div
                        {...getRootProps()}
                        className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:bg-gray-50 cursor-pointer ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                            }`}
                    >
                        <input {...getInputProps()} />
                        <UploadCloud className="mb-2 h-10 w-10 text-gray-400" />
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG</p>
                    </div>
                ) : (
                    <div className="mt-4 flex flex-col items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center space-x-3 w-full">
                            <File className="h-8 w-8 text-blue-500" />
                            <div className="flex-1 truncate">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isUploading}>
                                Cancel
                            </Button>
                        </div>
                        <Button className="w-full mt-4" onClick={handleUpload} disabled={isUploading}>
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                </>
                            ) : (
                                "Confirm Upload"
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}