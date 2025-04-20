import React from 'react';
import Image from 'next/image';
import { ImageType } from '@/types/image';
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardFooter, CardHeader
} from "@/components/ui/card";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import { Trash2, Edit } from 'lucide-react';

interface MediaCardProps {
    image: ImageType;
    onEditClick: (image: ImageType) => void;
    onDeleteClick: (id: number) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ image, onEditClick, onDeleteClick }) => {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-0">
                <div className="relative w-full aspect-video bg-muted"> {/* Aspect ratio container */}
                    <Image
                        src={image.url}
                        alt={image.altText || 'Uploaded image'}
                        fill // Changed from layout="fill"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        style={{ objectFit: 'cover' }} // Changed from objectFit="cover"
                        // Optional: Add placeholder and blurDataURL
                        // placeholder="blur"
                        // blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvdCLpwAAAABJRU5ErkJggg=="
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <p className="text-sm font-medium truncate" title={image.processedFilename}>
                    {image.processedFilename}
                </p>
                <p className="text-xs text-muted-foreground truncate" title={image.altText || 'No alt text'}>
                    Alt: {image.altText || <span className="italic">None</span>}
                </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onEditClick(image)}>
                                <Edit className="w-4 h-4" />
                                <span className="sr-only">Edit Alt Text</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Edit Alt Text</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDeleteClick(image.id)}>
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">Delete Image</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete Image</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
        </Card>
    );
}; 