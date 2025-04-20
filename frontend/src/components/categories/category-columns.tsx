'use client';

import { ColumnDef, Column, Row } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Category } from '@/types/category';

// Define props for the actions
interface CategoryColumnsProps {
  onEdit: (id: string) => void;
  onDeleteRequest: (category: Category) => void; // Renamed to clarify it requests deletion
}

// This function now takes handlers as arguments instead of using hooks
export const getCategoryColumns = ({ 
  onEdit, 
  onDeleteRequest 
}: CategoryColumnsProps): ColumnDef<Category>[] => {
  
  return [
    {
      accessorKey: 'title',
      header: ({ column }: { column: Column<Category> }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }: { row: Row<Category> }) => {
            const description = row.original.description;
            return description 
                ? <span title={description}>{description.substring(0, 50)}{description.length > 50 ? '...' : ''}</span> 
                : <span className="text-muted-foreground">N/A</span>;
        },
    },
    {
      accessorKey: 'parent_id',
      header: 'Parent ID',
      cell: ({ row }: { row: Row<Category> }) => row.original.parent_id ?? <span className="text-muted-foreground">None</span>,
    },
    {
      id: 'actions',
      cell: ({ row }: { row: Row<Category> }) => {
        const category = row.original;
        
        // Actions now call the passed-in handlers
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(category.id)}> 
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteRequest(category)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          // Dialog state is now managed in the parent component (CategoriesPage)
        );
      },
    },
  ];
}; 