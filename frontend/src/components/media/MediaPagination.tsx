import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationInfo } from '@/types/image';

interface MediaPaginationProps {
    pagination: PaginationInfo;
    onPrevPage: () => void;
    onNextPage: () => void;
    isLoading: boolean;
}

export const MediaPagination: React.FC<MediaPaginationProps> = ({
    pagination,
    onPrevPage,
    onNextPage,
    isLoading,
}) => {
    const { offset, limit, total, hasNextPage } = pagination;
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    if (total <= limit && offset === 0) {
        return null; // Don't show pagination if only one page
    }

    return (
        <div className="flex items-center justify-center mt-8 space-x-2">
            <Button
                variant="outline"
                size="icon"
                onClick={onPrevPage}
                disabled={offset === 0 || isLoading}
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="sr-only">Previous Page</span>
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="icon"
                onClick={onNextPage}
                disabled={!hasNextPage || isLoading}
            >
                <ChevronRight className="w-4 h-4" />
                <span className="sr-only">Next Page</span>
            </Button>
        </div>
    );
}; 