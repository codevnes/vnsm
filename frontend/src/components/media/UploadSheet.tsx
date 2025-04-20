'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, AlertCircle, ImagePlus } from 'lucide-react';

interface UploadSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (formData: FormData) => Promise<void>;
    isUploading: boolean;
    uploadError: string | null;
}

export const UploadSheet: React.FC<UploadSheetProps> = ({
    isOpen,
    onOpenChange,
    onSubmit,
    isUploading,
    uploadError,
}) => {
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadAltText, setUploadAltText] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [internalError, setInternalError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setInternalError(null);
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setInternalError('Invalid file type. Please select a JPG, PNG, GIF, or WebP file.');
                setUploadFile(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
             const maxSize = 10 * 1024 * 1024;
             if (file.size > maxSize) {
                 setInternalError(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
                 setUploadFile(null);
                 if (previewUrl) URL.revokeObjectURL(previewUrl);
                 setPreviewUrl(null);
                 if(fileInputRef.current) fileInputRef.current.value = "";
                 return;
             }

            setUploadFile(file);
            const newPreviewUrl = URL.createObjectURL(file);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(newPreviewUrl);
        } else {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setUploadFile(null);
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setInternalError(null);
        if (!uploadFile) {
            setInternalError("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append('image', uploadFile);
        formData.append('altText', uploadAltText.trim());

        await onSubmit(formData);
    };

    useEffect(() => {
        if (!isOpen) {
            setUploadFile(null);
            setUploadAltText('');
            setInternalError(null);
            if (previewUrl) {
                 URL.revokeObjectURL(previewUrl);
                 setPreviewUrl(null);
            }
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [isOpen, previewUrl]);

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[550px] flex flex-col overflow-hidden">
                <SheetHeader>
                    <SheetTitle>Upload New Image</SheetTitle>
                    <SheetDescription>
                        Select an image (JPG, PNG, GIF, WebP, max 10MB). Add descriptive alt text.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden pt-4">
                    <div className="flex-1 space-y-6 overflow-y-auto px-1 py-2">
                        {(uploadError || internalError) && (
                            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                                <span>{uploadError || internalError}</span>
                            </div>
                        )}

                        <div>
                            <Label>Image Preview & Selection</Label>
                            <div className="mt-2 flex justify-center items-center w-full h-48 border-2 border-dashed border-muted-foreground/50 rounded-md bg-muted/40 relative overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Selected preview" className="object-contain max-h-full max-w-full" />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <ImagePlus className="mx-auto h-12 w-12" />
                                        <p className="mt-2 text-sm">No image selected</p>
                                    </div>
                                )}
                            </div>
                            <Input
                                ref={fileInputRef}
                                id="image-file-input"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleFileChange}
                                className="sr-only"
                                disabled={isUploading}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={triggerFileInput}
                                disabled={isUploading}
                            >
                                {uploadFile ? "Change Image" : "Select Image"}
                            </Button>
                             {uploadFile && (
                                <p className="text-sm text-muted-foreground mt-1 text-center truncate" title={uploadFile.name}>Selected: {uploadFile.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="alt-text">Alt Text (Required for SEO)</Label>
                            <Textarea
                                id="alt-text"
                                value={uploadAltText}
                                onChange={(e) => setUploadAltText(e.target.value)}
                                placeholder="Describe the image content and context (e.g., 'A black cat sleeping on a red couch')"
                                className="min-h-[100px] resize-none"
                                disabled={isUploading}
                            />
                        </div>
                    </div>

                    <SheetFooter className="mt-auto pt-4 border-t bg-background">
                        <SheetClose asChild>
                            <Button type="button" variant="outline" disabled={isUploading}>Cancel</Button>
                        </SheetClose>
                        <Button type="submit" disabled={isUploading || !uploadFile}>
                            {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2"/> Confirm Upload</>}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}; 