'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { imageService } from '@/services/imageService';
import { Image } from '@/types/image';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import NextImage from 'next/image'; // Use Next.js Image for optimization
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ImageSelectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImageSelect: (image: Image) => void; // Callback when an image is selected
}

const ITEMS_PER_PAGE = 18; // Number of images to load per page/batch

export const ImageSelectorDialog: React.FC<ImageSelectorDialogProps> = ({ 
    open, 
    onOpenChange, 
    onImageSelect 
}) => {
    const [images, setImages] = useState<Image[]>([]);
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState<number>(0);
    const [hasNextPage, setHasNextPage] = useState<boolean>(true);

    const fetchImages = useCallback(async (currentOffset: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await imageService.getAllImages(ITEMS_PER_PAGE, currentOffset);
            // Append new images to the existing list
            setImages(prevImages => currentOffset === 0 ? response.data : [...prevImages, ...response.data]);
            setHasNextPage(response.pagination.hasNextPage);
            setOffset(currentOffset + ITEMS_PER_PAGE);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch images.');
            toast.error('Error fetching images', { description: err.message });
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch initial batch when the dialog opens
    useEffect(() => {
        if (open) {
            setImages([]); // Reset images when dialog re-opens
            setOffset(0);
            setSelectedImage(null); // Reset selection
            fetchImages(0);
        }
    }, [open, fetchImages]);

    const handleSelect = () => {
        if (selectedImage) {
            onImageSelect(selectedImage);
            onOpenChange(false); // Close dialog after selection
        }
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.currentTarget;
        // Check if scrolled near the bottom
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) { 
            if (hasNextPage && !loading) {
                fetchImages(offset); // Fetch next page
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[80%] lg:max-w-[60%]">
                <DialogHeader>
                    <DialogTitle>Select an Image</DialogTitle>
                    <DialogDescription>
                        Browse previously uploaded images. Click an image to select it.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea 
                    className="h-[60vh] w-full rounded-md border p-4" 
                    onScroll={handleScroll} // Attach scroll handler
                >
                    {error && <p className="text-red-500 text-center">Error: {error}</p>}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {images.map((image) => (
                            <div 
                                key={image.id} 
                                className={`cursor-pointer border-2 rounded-md overflow-hidden transition-all ${selectedImage?.id === image.id ? 'border-primary ring-2 ring-primary' : 'border-transparent'}`}
                                onClick={() => setSelectedImage(image)}
                            >
                                <AspectRatio ratio={1 / 1}>
                                    <NextImage
                                        src={image.url} 
                                        alt={image.altText || image.filename}
                                        fill // Use fill for AspectRatio
                                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw" // Adjust sizes as needed
                                        className="object-cover"
                                        onError={(e) => { e.currentTarget.src = '/placeholder-image.png'; }} // Fallback image
                                    />
                                </AspectRatio>
                            </div>
                        ))}
                    </div>
                    {loading && (
                        <div className="flex justify-center items-center py-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {!loading && !hasNextPage && images.length > 0 && (
                        <p className="text-center text-muted-foreground py-4">No more images.</p>
                    )}
                     {!loading && images.length === 0 && !error && (
                        <p className="text-center text-muted-foreground py-4">No images found.</p>
                    )}
                </ScrollArea>

                <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSelect} disabled={!selectedImage || loading}>
                        Select Image
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}; 