import React from 'react';
import { ImageType } from '@/types/image';
import { MediaCard } from './MediaCard';

interface MediaGridProps {
    images: ImageType[];
    onEdit: (image: ImageType) => void;
    onDelete: (id: number) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ images, onEdit, onDelete }) => {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
                <MediaCard
                    key={image.id}
                    image={image}
                    onEditClick={onEdit}
                    onDeleteClick={onDelete}
                />
            ))}
        </div>
    );
}; 