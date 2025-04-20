'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { postSchema, PostFormValues } from "@/lib/schemas/postSchema";
import { Category } from '@/types/category';
import { Stock } from '@/types/stock'; // Assuming Stock type and fetching exists
import { Image } from '@/types/image';
import { Loader2, Upload, Trash2, ImagePlus, RefreshCw } from 'lucide-react';
import { ImageSelectorDialog } from '@/components/images/image-selector-dialog';
import { imageService } from '@/services/imageService';
import { toast } from 'sonner';
import NextImage from 'next/image';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import RichTextEditor from './RichTextEditor';
import { useRouter } from 'next/navigation';
import { Post } from '@/types/post';
import { api } from "@/lib/api";

// Client-side slug generation (same as category form)
const generateSlug = (title: string): string => {
    if (!title) return '';
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

// Extend props to include necessary data like categories and stocks
interface PostFormProps {
    onSubmitForm: (data: PostFormValues, isEditing: boolean) => Promise<void>; 
    initialData?: Partial<PostFormValues & { id?: string }>; // Include id for slug logic
    allCategories: Category[]; 
    allStocks: Stock[]; // Add stocks prop
    isLoading?: boolean; // Form submission loading state
    submitButtonText?: string;
    post?: Post | null;
}

export const PostForm: React.FC<PostFormProps> = ({ 
    onSubmitForm, 
    initialData = {}, 
    allCategories,
    allStocks, // Receive stocks
    isLoading = false,
    submitButtonText = 'Create Post',
    post
}) => {
    const router = useRouter();
    const isEditing = !!post;

    // Prepare the object to pass to the `values` prop
    // Ensure required fields have a valid initial type, even if empty for create
    const currentFormValues = {
        title: initialData?.title || '',
        slug: initialData?.slug || (initialData?.id ? '' : generateSlug(initialData?.title || '')), 
        description: initialData?.description || '',
        content: initialData?.content || '',
        thumbnail: initialData?.thumbnail || null,
        // Use initialData value if present, otherwise empty string for controlled required field
        category_id: initialData?.category_id || '', 
        stock_id: initialData?.stock_id || null,
    };

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        // FIX: Provide both defaultValues and values when using values for reinitialization
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            content: '',
            thumbnail: null,
            category_id: undefined, // Default required select to undefined initially
            stock_id: null,
        },
        values: currentFormValues, // Use `values` prop to sync with initialData changes
    });

    const { watch, setValue, getValues, formState: { dirtyFields } } = form;
    const watchedTitle = watch('title');

    // Thumbnail state (same as CategoryForm)
    const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState<string | null>(initialData?.thumbnail || null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

    // --- Image Modal State ---
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    // Ref to store the promise resolve function for image selection
    const resolveImageSelectionRef = useRef<((value: string | null) => void) | null>(null);

    // Slug generation effect
    useEffect(() => {
        if (!initialData?.id && !dirtyFields.slug) {
            setValue('slug', generateSlug(watchedTitle), { shouldValidate: true });
        }
    }, [watchedTitle, initialData?.id, dirtyFields.slug, setValue]);

    // Effect to update thumbnail *preview* state when initialData changes
    // Form value itself is handled by the `values` prop in useForm
    useEffect(() => {
        setSelectedThumbnailUrl(initialData?.thumbnail || null);
    }, [initialData?.thumbnail]); // Depend only on the specific prop

    // Image handling functions (handleImageSelect, handleFileUpload, clearThumbnail) - same as CategoryForm
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
    };

    // Regenerate slug
    const regenerateSlug = () => {
        setValue('slug', generateSlug(getValues('title')), { shouldValidate: true, shouldDirty: true });
    };

    const disableForm = isLoading || isUploading;

    // Filter parent categories (no change needed)
    const parentCategoryOptions = allCategories.filter(
        category => initialData?.id ? category.id !== initialData.id : true // Assuming category has id
    );

    // Function to trigger image library modal
    const handleShowImageLibrary = (): Promise<string | null> => {
        return new Promise((resolve) => {
            // Store the resolve function in the ref
            resolveImageSelectionRef.current = resolve;
            // Open the modal
            setIsImageModalOpen(true);
        });
    };

    // Unified callback for when an image is selected in the dialog
    const handleImageSelected = (image: Image | null) => {
        const imageUrl = image?.url || null;
        if (resolveImageSelectionRef.current) {
            resolveImageSelectionRef.current(imageUrl);
            resolveImageSelectionRef.current = null;
        }
        setIsImageModalOpen(false);
    };

    // Callback to close the modal without selection
    const handleCloseModal = () => {
        if (resolveImageSelectionRef.current) {
            resolveImageSelectionRef.current(null); // Resolve with null if cancelled
        }
        setIsImageModalOpen(false);
        resolveImageSelectionRef.current = null;
    };

    // Thumbnail selection logic (assuming ImageSelectorDialog for this too)
    const handleThumbnailSelect = (url: string | null) => {
        if (url) {
            setSelectedThumbnailUrl(url);
            setValue('thumbnail', url, { shouldValidate: true });
        }
        setIsImageModalOpen(false); // Close the same modal for now
    };
    const handleShowThumbnailLibrary = () => {
        // Re-use the modal logic, but trigger a different handler on select
        // We need a way to differentiate the purpose when opening the modal
        // Option 1: Pass a flag/type to the modal opener
        // Option 2: Use separate state/handlers (more complex)
        // Let's stick to Option 1 conceptually for now, but implement simpler re-use:
        // Open the modal, and handle the result in handleThumbnailSelect
        setIsImageModalOpen(true);
        // We need the dialog's onSelect to know which field to update
        // Simplification: For now, assume one modal instance, handle result in handleThumbnailSelect
    };

    async function onSubmit(data: PostFormValues) {
        const payload = {
            ...data,
            category_id: parseInt(data.category_id, 10),
            stock_id: data.stock_id ? parseInt(data.stock_id, 10) : null,
            // TODO: Get user_id from auth context
            user_id: 1, // Hardcoded for now
        };

        try {
            let response;
            if (isEditing && post?.id) {
                // Update existing post
                response = await api.put(`/posts/${post.id}`, payload);
                toast.success("Post Updated", { description: "Your post has been successfully updated." });
            } else {
                // Create new post
                response = await api.post("/posts", payload);
                toast.success("Post Created", { description: "Your new post has been successfully created." });
            }

            // Redirect or handle success (e.g., go to post page)
            // Example: Redirect to dashboard or the new/updated post
            router.push('/dashboard/posts'); // Or router.push(`/blog/${response.data.slug}`);
            router.refresh(); // Refresh server components

        } catch (error: any) {
            console.error("Error submitting post:", error);
            const errorMsg = error.response?.data?.message || (isEditing ? "Failed to update post." : "Failed to create post.");
            toast.error("Submission Error", {
                description: errorMsg,
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Title Field */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                                <Input placeholder="Post title..." {...field} disabled={disableForm} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Slug Field */}
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input placeholder="post-slug..." {...field} value={field.value ?? ''} disabled={disableForm} className="flex-grow" />
                                </FormControl>
                                <Button type="button" variant="outline" size="icon" onClick={regenerateSlug} disabled={disableForm || !watchedTitle} title="Regenerate slug from title">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                            <FormDescription>URL-friendly version of the title (auto-generated, can be edited).</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Category Select */}
                 <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={disableForm}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {allCategories.length === 0 && <SelectItem value="loading-cats" disabled>Loading...</SelectItem>}
                                    {allCategories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                 {/* Stock Select (Optional) */}
                 <FormField
                    control={form.control}
                    name="stock_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Related Stock (Optional)</FormLabel>
                            <Select 
                                onValueChange={(value) => field.onChange(value === 'none' ? null : value)} 
                                value={field.value ?? undefined}
                                disabled={disableForm}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a stock (optional)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">-- None --</SelectItem>
                                    {allStocks && allStocks.length > 0 ? (
                                        allStocks.map((stock) => (
                                            <SelectItem key={stock.id} value={stock.id}>
                                                {stock.symbol} - {stock.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                         <SelectItem value="loading-stocks" disabled>Loading or N/A...</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                             <FormDescription>Link this post to a specific stock.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Thumbnail Field (Using Image Selector/Upload) */}
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
                            <Button type="button" variant="outline" onClick={() => setIsSelectorOpen(true)} disabled={disableForm}>
                                Select Existing Image
                            </Button>
                            <Button type="button" variant="outline" asChild disabled={disableForm}>
                                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                                     {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                     Upload New Image
                                    <input id="thumbnail-upload" type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" disabled={disableForm}/>
                                </label>
                            </Button>
                             {selectedThumbnailUrl && (
                                 <Button type="button" variant="ghost" size="sm" onClick={clearThumbnail} className="text-destructive hover:text-destructive" disabled={disableForm}>
                                    <Trash2 className="mr-1 h-3 w-3" /> Remove Thumbnail
                                 </Button>
                             )}
                        </div>
                    </div>
                     <FormDescription>Select a previously uploaded image or upload a new one.</FormDescription>
                     <FormMessage>{form.formState.errors.thumbnail?.message}</FormMessage>
                 </FormItem>

                 {/* Description Field */}
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Short Description / Excerpt</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="A brief summary of the post..." 
                                    {...field} 
                                    value={field.value ?? ''} 
                                    disabled={disableForm}
                                    rows={3}
                                />
                            </FormControl>
                             <FormDescription>Appears in post listings and previews.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                 {/* Content Field - Use RichTextEditor */}
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                                {/* Replace Textarea with RichTextEditor */}
                                <RichTextEditor
                                    content={field.value ?? ''} // Pass form value to editor
                                    onChange={field.onChange} // Use RHF's onChange to update form state
                                    placeholder="Write the main content..."
                                    disabled={disableForm}
                                    onShowImageLibrary={handleShowImageLibrary}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Submit Button */} 
                <Button type="submit" disabled={disableForm}>
                    {disableForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {disableForm ? 'Saving...' : submitButtonText}
                </Button>
            </form>

            {/* Image Selector Dialog */} 
            {isImageModalOpen && (
                <ImageSelectorDialog 
                    open={isImageModalOpen}
                    onOpenChange={setIsImageModalOpen}
                    onImageSelect={handleImageSelected}
                />
            )}
        </Form>
    );
}; 