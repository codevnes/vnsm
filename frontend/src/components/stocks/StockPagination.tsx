import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StockPaginationInfo } from '@/types/stock';

interface StockPaginationProps {
    pagination: StockPaginationInfo;
    onPageChange: (page: number) => void; // Handler to go to a specific page
    isLoading: boolean;
}

export const StockPagination: React.FC<StockPaginationProps> = ({
    pagination,
    onPageChange,
    isLoading,
}) => {
    const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

    if (totalPages <= 1) {
        return null; // Don't show if only one page or no items
    }

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="flex items-center justify-center mt-6 space-x-2">
            <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={currentPage === 1 || isLoading}
                aria-label="Go to previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentPage === totalPages || isLoading}
                aria-label="Go to next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}; 