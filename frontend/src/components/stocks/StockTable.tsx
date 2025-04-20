'use client';

import React from 'react';
import { StockType } from '@/types/stock';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // For displaying optional fields nicely
import Link from "next/link";

interface StockTableProps {
    stocks: StockType[];
    onEdit: (stock: StockType) => void;
    onDelete: (stock: StockType) => void;
    isLoading: boolean; // To show loading state in table body
}

export const StockTable: React.FC<StockTableProps> = ({
    stocks,
    onEdit,
    onDelete,
    isLoading
}) => {

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return 'Invalid Date';
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Exchange</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Q-Index</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Loading stocks...
                            </TableCell>
                        </TableRow>
                    ) : stocks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No stocks found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        stocks.map((stock) => (
                            <TableRow key={stock.id}>
                                <TableCell className="font-medium">
                                    <Badge variant="secondary">{stock.symbol}</Badge>
                                </TableCell>
                                <TableCell>{stock.name}</TableCell>
                                <TableCell>{stock.exchange || <span className="text-muted-foreground italic">N/A</span>}</TableCell>
                                <TableCell>{stock.industry || <span className="text-muted-foreground italic">N/A</span>}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/stocks/${stock.id}/qindices`}>
                                            <BarChart2 className="mr-2 h-4 w-4" />
                                            Q-Indices
                                        </Link>
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => onEdit(stock)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/stocks/${stock.id}/qindices`}>
                                                    View Q-Indices
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onDelete(stock)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}; 