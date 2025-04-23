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

// Improved slug generation function to handle non-Latin characters like Vietnamese
const generateSlug = (title: string): string => {
    if (!title) return '';
    
    // Normalize Vietnamese characters to Latin equivalents
    const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return normalized
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphen
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
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
    submitButtonText = 'Tạo Danh Mục'
}) => {
    // Form setup with default values
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            thumbnail: initialData?.thumbnail || null,
            parent_id: initialData?.parent_id || null,
            slug: initialData?.slug || '',
        },
        mode: 'onChange', // Validate on field change
    });

    const { watch, setValue, getValues, formState: { dirtyFields } } = form;
    const watchedTitle = watch('title');
    const watchedSlug = watch('slug');

    const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState<string | null>(initialData?.thumbnail || null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

    // Initialize thumbnail URL
    useEffect(() => {
        if (initialData?.thumbnail) {
            console.log('Setting initial thumbnail:', initialData.thumbnail);
            setSelectedThumbnailUrl(initialData.thumbnail);
            setValue('thumbnail', initialData.thumbnail);
        }
    }, [initialData?.thumbnail, setValue]);

    // Initial setup of slug value if needed
    useEffect(() => {
        if (initialData?.slug) {
            setValue('slug', initialData.slug);
        } else if (initialData?.title && !initialData.slug) {
            setValue('slug', generateSlug(initialData.title));
        }
    }, [initialData?.slug, initialData?.title, setValue]);

    // Auto-generate slug whenever title changes and slug field hasn't been edited manually
    useEffect(() => {
        if (watchedTitle && (!watchedSlug || !dirtyFields.slug)) {
            const generatedSlug = generateSlug(watchedTitle);
            setValue('slug', generatedSlug);
        }
    }, [watchedTitle, watchedSlug, dirtyFields.slug, setValue]);

    // Improved image selection handler with better error checking
    const handleImageSelect = useCallback((image: Image) => {
        
        if (!image) {
            console.error('No image selected');
            return;
        }
        
        if (!image.url) {
            console.error('Selected image has no URL');
            return;
        }
        
        setSelectedThumbnailUrl(image.url);
        setValue('thumbnail', image.url, { shouldValidate: true, shouldDirty: true });
        setIsSelectorOpen(false);
        
        // Verify the value was set
        setTimeout(() => {
            const currentValue = getValues('thumbnail');
        }, 100);
    }, [getValues, setValue]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const altText = file.name; 
            const uploadedImage = await imageService.uploadImage(file, altText);
            setSelectedThumbnailUrl(uploadedImage.url);
            setValue('thumbnail', uploadedImage.url, { shouldValidate: true, shouldDirty: true });
            toast.success('Đã tải hình ảnh lên thành công!');
        } catch (error: any) {
            console.error('Image upload failed:', error);
            toast.error('Tải hình ảnh lên thất bại', { description: error.message });
        } finally {
            setIsUploading(false);
            event.target.value = ''; 
        }
    };
    
    const clearThumbnail = useCallback(() => {
        ('Clearing thumbnail');
        setSelectedThumbnailUrl(null);
        setValue('thumbnail', null, { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    const regenerateSlug = useCallback(() => {
        const title = form.getValues('title');
        if (!title) {
            toast.error('Vui lòng nhập tiêu đề trước khi tạo đường dẫn');
            return;
        }
        const newSlug = generateSlug(title);
        setValue('slug', newSlug, { shouldValidate: true, shouldDirty: true });
        toast.success('Đã tạo đường dẫn mới');
    }, [form, setValue]);

    const parentCategoryOptions = allCategories.filter(
        category => initialData?.id ? category.id !== initialData.id : true
    );

    const disableForm = isLoading || isUploading;

    // Display current form values for debugging
    useEffect(() => {
        const currentValues = form.getValues();
    }, [form, selectedThumbnailUrl]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(values => onSubmit({...values, slug: values.slug || null}))} className="space-y-8">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tiêu đề *</FormLabel>
                            <FormControl>
                                <Input placeholder="VD: Công nghệ" {...field} disabled={disableForm} />
                            </FormControl>
                            <FormDescription>
                                Tiêu đề chính của danh mục.
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
                            <FormLabel>Đường dẫn</FormLabel>
                             <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input 
                                        placeholder="VD: cong-nghe" 
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
                                    title="Tạo lại đường dẫn từ tiêu đề"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                             </div>
                            <FormDescription>
                                Phiên bản thân thiện với URL của tiêu đề (tự động tạo, có thể chỉnh sửa).
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
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Mô tả ngắn gọn về danh mục..." 
                                    {...field} 
                                    value={field.value ?? ''}
                                    disabled={disableForm}
                                />
                            </FormControl>
                             <FormDescription>
                                Tùy chọn: Cung cấp thêm thông tin về danh mục.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormItem>
                    <FormLabel>Hình thu nhỏ</FormLabel>
                    <FormControl>
                         <Controller
                            name="thumbnail"
                            control={form.control}
                            render={({ field }) => (
                                <input type="hidden" {...field} value={field.value ?? ''} /> 
                            )}
                         />
                    </FormControl>
                   
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 border rounded-md overflow-hidden bg-muted flex items-center justify-center relative">
                             {selectedThumbnailUrl ? (
                                <div className="relative w-full h-full">
                                    <NextImage 
                                        src={selectedThumbnailUrl}
                                        alt="Hình thu nhỏ đã chọn" 
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                        priority
                                        onError={(e) => { 
                                            console.error('Image load error:', e);
                                            e.currentTarget.src = '/placeholder-image.png'; 
                                        }}
                                    />
                                </div>
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
                                Chọn Hình Có Sẵn
                            </Button>
                            
                            <Button type="button" variant="outline" asChild disabled={disableForm}>
                                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                                     {isUploading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                     ) : (
                                        <Upload className="mr-2 h-4 w-4" /> 
                                     )}
                                     Tải Lên Hình Mới
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
                                    <Trash2 className="mr-1 h-3 w-3" /> Xóa Hình Thu Nhỏ
                                 </Button>
                             )}
                        </div>
                    </div>
                     <FormDescription>
                         Chọn một hình ảnh đã tải lên trước đó hoặc tải lên hình mới.
                     </FormDescription>
                     <FormMessage>{form.formState.errors.thumbnail?.message}</FormMessage>
                 </FormItem>
                
                <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Danh Mục Cha</FormLabel>
                            <Select 
                                onValueChange={(value: string) => field.onChange(value === 'none' ? null : value)} 
                                defaultValue={field.value ?? 'none'}
                                disabled={disableForm}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn danh mục cha (không bắt buộc)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">-- Không có --</SelectItem>
                                    {parentCategoryOptions.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Đặt danh mục này dưới một danh mục đã tồn tại.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={disableForm}>
                    {disableForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {disableForm ? 'Đang lưu...' : submitButtonText}
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