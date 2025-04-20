'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from 'lucide-react';
import { ImageType } from '@/types/image';

interface EditDialogProps {
    image: ImageType | null; // The image being edited (or null if dialog closed)
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (id: number, altText: string | null) => Promise<void>; // Async submit
    isEditing: boolean;
    editError: string | null;
}

export const EditDialog: React.FC<EditDialogProps> = ({
    image,
    isOpen,
    onOpenChange,
    onSubmit,
    isEditing,
    editError,
}) => {
    const [currentAltText, setCurrentAltText] = useState<string>('');

    // Update internal state when the image prop changes (dialog opens)
    useEffect(() => {
        if (image) {
            setCurrentAltText(image.altText || '');
        } else {
             setCurrentAltText(''); // Reset when closing
        }
    }, [image]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!image) return;
        await onSubmit(image.id, currentAltText.trim() || null); // Pass null if empty
        // Let the hook handle closing the dialog on success
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Alt Text</DialogTitle>
                    <DialogDescription>
                        Update the descriptive alt text for the image: {image?.processedFilename ?? ''}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {editError && (
                        <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0"/>
                            {editError}
                        </div>
                    )}
                    <div className="grid items-center gap-2">
                        <Label htmlFor="edit-alt-text">Alt Text</Label>
                        <Textarea
                            id="edit-alt-text"
                            value={currentAltText}
                            onChange={(e) => setCurrentAltText(e.target.value)}
                            placeholder="Describe the image content and context"
                            className="min-h-[100px]" // Slightly taller textarea
                            disabled={isEditing}
                            required
                        />
                    </div>
                    <DialogFooter className="mt-2"> {/* Reduced margin */}
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isEditing}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isEditing}>
                            {isEditing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}; 