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
import { Post } from '@/types/post';
import { Badge } from "@/components/ui/badge"
import Link from 'next/link';

// Define props for the actions (similar to categories)
interface PostColumnsProps {
  onEdit: (id: string) => void;
  onDeleteRequest: (post: Post) => void; // Pass the whole post for context in delete dialog
}

// Function to define columns, taking handlers as arguments
export const getPostColumns = ({ 
  onEdit, 
  onDeleteRequest 
}: PostColumnsProps): ColumnDef<Post>[] => {
  
  return [
    {
        accessorKey: 'title',
        header: ({ column }: { column: Column<Post> }) => {
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
        cell: ({ row }: { row: Row<Post> }) => {
            // Make title clickable, linking to edit page for convenience
            const post = row.original;
            return (
                <Link href={`/dashboard/posts/${post.id}/edit`} className="hover:underline font-medium">
                    {post.title}
                </Link>
            );
        }
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: { row: Row<Post> }) => {
        const category = row.original.category;
        return category ? (
             <Link href={`/dashboard/categories/${category.id}/edit`} className="hover:underline text-sm">
                 {category.title}
             </Link>
         ) : <span className="text-muted-foreground">N/A</span>;
      },
      // Enable filtering by category title if needed (requires adjustments)
      // filterFn: (row, id, value) => { ... }
    },
    {
        accessorKey: 'user',
        header: 'Author',
        cell: ({ row }: { row: Row<Post> }) => {
            const user = row.original.user;
            return user ? user.full_name : <span className="text-muted-foreground">N/A</span>;
        },
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
     {
        accessorKey: 'createdAt',
        header: ({ column }: { column: Column<Post> }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Created At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }: { row: Row<Post> }) => {
             const date = new Date(row.getValue('createdAt'));
             return <div className="text-sm">{date.toLocaleDateString()}</div>;
        },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: Row<Post> }) => { 
        const post = row.original;
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
              <DropdownMenuItem onClick={() => onEdit(post.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteRequest(post)} // Pass the whole post
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}; 