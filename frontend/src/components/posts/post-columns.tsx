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
                    className="dark:text-gray-100"
                >
                    Tiêu đề
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }: { row: Row<Post> }) => {
            // Make title clickable, linking to edit page for convenience
            const post = row.original;
            return (
                <Link href={`/dashboard/posts/${post.id}/edit`} className="hover:underline font-medium dark:text-gray-100">
                    {post.title}
                </Link>
            );
        }
    },
    {
      accessorKey: 'category',
      header: 'Danh mục',
      cell: ({ row }: { row: Row<Post> }) => {
        const category = row.original.category;
        return category ? (
             <Link href={`/dashboard/categories/${category.id}/edit`} className="hover:underline text-sm dark:text-gray-300">
                 {category.title}
             </Link>
         ) : <span className="text-muted-foreground dark:text-gray-500">N/A</span>;
      },
    },
    {
        accessorKey: 'user',
        header: 'Tác giả',
        cell: ({ row }: { row: Row<Post> }) => {
            const user = row.original.user;
            return user ? <span className="dark:text-gray-300">{user.full_name}</span> : <span className="text-muted-foreground dark:text-gray-500">N/A</span>;
        },
    },
     {
        accessorKey: 'createdAt',
        header: ({ column }: { column: Column<Post> }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="dark:text-gray-100"
                >
                    Ngày tạo
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }: { row: Row<Post> }) => {
             const date = new Date(row.getValue('createdAt'));
             return <div className="text-sm dark:text-gray-300">{date.toLocaleDateString()}</div>;
        },
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: ({ row }: { row: Row<Post> }) => { 
        const post = row.original;
        // Now returning direct buttons instead of dropdown for more modern look
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:border-blue-900"
              onClick={() => onEdit(post.id)}
            >
              <Pencil className="mr-1 h-3 w-3" />
              Sửa
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 dark:border-red-900"
              onClick={() => onDeleteRequest(post)}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Xóa
            </Button>
          </div>
        );
      },
    },
  ];
}; 