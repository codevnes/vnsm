import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Setting } from "@/types/setting";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SettingColumnProps {
  onEdit: (id: string) => void;
  onDeleteRequest: (setting: Setting) => void;
}

export const getSettingColumns = ({ onEdit, onDeleteRequest }: SettingColumnProps): ColumnDef<Setting>[] => [
  {
    accessorKey: "key",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Key
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("key")}</div>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("type")}
      </Badge>
    ),
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const value = row.getValue("value") as string;
      
      // For long text or JSON values, truncate the display
      if (value && (type === 'json' || type === 'html' || value.length > 50)) {
        return (
          <div className="font-mono text-xs max-w-xs truncate" title={value}>
            {value.substring(0, 50)}...
          </div>
        );
      }
      
      return <div className="max-w-xs truncate">{value}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return description ? (
        <div className="max-w-xs truncate" title={description}>
          {description}
        </div>
      ) : (
        <div className="text-muted-foreground italic">No description</div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Last Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.getValue("updatedAt")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const setting = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(setting.key)}
            title="Edit setting"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteRequest(setting)}
            className="text-destructive hover:text-destructive"
            title="Delete setting"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
]; 