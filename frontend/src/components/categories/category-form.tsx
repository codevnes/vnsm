'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue 
} from "@/components/ui/select";
import { categorySchema, CategoryFormValues } from "@/lib/schemas/categorySchema";
import { Category } from '@/types/category';
import { Image } from '@/types/image';
import { Loader2, Upload, Trash2, ImagePlus, RefreshCw } from 'lucide-react';
import { ImageSelectorDialog } from '@/components/images/image-selector-dialog';
import { imageService } from '@/services/imageService';
import { toast } from 'sonner';
import NextImage from 'next/image';
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Client-side slug generation utility
const generateSlug = (title: string): string => {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphen
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')            // Trim - from start of text
        .replace(/-+$/, '');           // Trim - from end of text
};

interface CategoryFormProps {
    onSubmit: (values: CategoryFormValues) => Promise<void>;
    initialData?: Partial<CategoryFormValues & { id?: string }>;
    allCategories: Category[];
    isLoading?: boolean;
    submitButtonText?: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ 
    onSubmit, 
    initialData = {}, 
    allCategories,
    isLoading = false,
    submitButtonText = 'Create Category'
}) => {
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            thumbnail: initialData?.thumbnail || null,
            parent_id: initialData?.parent_id || null,
            slug: initialData?.slug || '',
        },
    });

    const { watch, setValue, formState: { dirtyFields } } = form;
    const watchedTitle = watch('title');

    const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState<string | null>(initialData?.thumbnail || null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

    useEffect(() => {
        if (!initialData?.id && !dirtyFields.slug) {
            const generated = generateSlug(watchedTitle);
            setValue('slug', generated, { shouldValidate: true });
        }
    }, [watchedTitle, initialData?.id, dirtyFields.slug, setValue]);

    useEffect(() => {
        setSelectedThumbnailUrl(initialData?.thumbnail || null);
        setValue('slug', initialData?.slug || generateSlug(initialData?.title || ''));
    }, [initialData, setValue]);

    const handleImageSelect = (image: Image) => {
        setSelectedThumbnailUrl(image.url);
        setValue('thumbnail', image.url, { shouldValidate: true, shouldDirty: true });
        setIsSelectorOpen(false);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const altText = file.name; 
            const uploadedImage = await imageService.uploadImage(file, altText);
            setSelectedThumbnailUrl(uploadedImage.url);
            setValue('thumbnail', uploadedImage.url, { shouldValidate: true, shouldDirty: true });
            toast.success('Image uploaded successfully!');
        } catch (error: any) {
            toast.error('Image upload failed', { description: error.message });
        } finally {
            setIsUploading(false);
            event.target.value = ''; 
        }
    };
    
    const clearThumbnail = () => {
        setSelectedThumbnailUrl(null);
        setValue('thumbnail', null, { shouldValidate: true, shouldDirty: true });
    }

    const regenerateSlug = () => {
        const title = form.getValues('title');
        setValue('slug', generateSlug(title), { shouldValidate: true, shouldDirty: true });
    }

    const parentCategoryOptions = allCategories.filter(
        category => initialData?.id ? category.id !== initialData.id : true
    );

    const disableForm = isLoading || isUploading;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(values => onSubmit({...values, slug: values.slug || null}))} className="space-y-8">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Technology" {...field} disabled={disableForm} />
                            </FormControl>
                            <FormDescription>
                                The main title of the category.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug</FormLabel>
                             <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input 
                                        placeholder="e.g., technology-news" 
                                        {...field} 
                                        value={field.value ?? ''} 
                                        disabled={disableForm} 
                                        className="flex-grow"
                                    />
                                </FormControl>
                                <Button 
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={regenerateSlug}
                                    disabled={disableForm || !watchedTitle}
                                    title="Regenerate slug from title"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                             </div>
                            <FormDescription>
                                URL-friendly version of the title (auto-generated, can be edited).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="A brief description of the category..." 
                                    {...field} 
                                    value={field.value ?? ''}
                                    disabled={disableForm}
                                />
                            </FormControl>
                             <FormDescription>
                                Optional: Provide more context about the category.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                         <Controller
                            name="thumbnail"
                            control={form.control}
                            render={({ field }) => (
                                <input type="hidden" {...field} value={selectedThumbnailUrl ?? ''} /> 
                            )}
                         />
                    </FormControl>
                   
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                             {selectedThumbnailUrl ? (
                                <AspectRatio ratio={1/1} className="bg-muted">
                                    <NextImage 
                                        src={selectedThumbnailUrl}
                                        alt="Selected thumbnail" 
                                        fill
                                        className="object-cover"
                                        onError={(e) => { e.currentTarget.src = '/placeholder-image.png'; }}
                                    />
                                </AspectRatio>
                             ) : (
                                 <ImagePlus className="h-8 w-8 text-muted-foreground" />
                             )}
                        </div>
                       
                        <div className="flex flex-col gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsSelectorOpen(true)} 
                                disabled={disableForm}
                            >
                                Select Existing Image
                            </Button>
                            
                            <Button type="button" variant="outline" asChild disabled={disableForm}>
                                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                                     {isUploading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                     ) : (
                                        <Upload className="mr-2 h-4 w-4" /> 
                                     )}
                                     Upload New Image
                                    <input 
                                        id="thumbnail-upload"
                                        type="file"
                                        accept="image/png, image/jpeg, image/gif, image/webp"
                                        onChange={handleFileUpload}
                                        className="sr-only"
                                        disabled={disableForm}
                                    />
                                </label>
                            </Button>

                             {selectedThumbnailUrl && (
                                 <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={clearThumbnail} 
                                    className="text-destructive hover:text-destructive"
                                    disabled={disableForm}
                                 >
                                    <Trash2 className="mr-1 h-3 w-3" /> Remove Thumbnail
                                 </Button>
                             )}
                        </div>
                    </div>
                     <FormDescription>
                         Select a previously uploaded image or upload a new one.
                     </FormDescription>
                     <FormMessage>{form.formState.errors.thumbnail?.message}</FormMessage>
                 </FormItem>
                
                <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Parent Category</FormLabel>
                            <Select 
                                onValueChange={(value: string) => field.onChange(value === 'none' ? null : value)} 
                                defaultValue={field.value ?? 'none'}
                                disabled={disableForm}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a parent category (optional)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">-- None --</SelectItem>
                                    {parentCategoryOptions.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Assign this category under another existing category.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={disableForm}>
                    {disableForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {disableForm ? 'Saving...' : submitButtonText}
                </Button>
            </form>

            <ImageSelectorDialog 
                open={isSelectorOpen}
                onOpenChange={setIsSelectorOpen}
                onImageSelect={handleImageSelect}
            />
        </Form>
    );
}; 