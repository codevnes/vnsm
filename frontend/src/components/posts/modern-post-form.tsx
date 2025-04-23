'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
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
import { Stock } from '@/types/stock';
import { Image } from '@/types/image';
import { Loader2, Upload, Trash2, ImagePlus, RefreshCw, BriefcaseBusiness, BarChart3, PenTool, ChevronDown } from 'lucide-react';
import { ImageSelectorDialog } from '@/components/images/image-selector-dialog';
import { imageService } from '@/services/imageService';
import { toast } from 'sonner';
import NextImage from 'next/image';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from 'next/dynamic';
import { ScrollArea } from '@/components/ui/scroll-area';

// Dynamically import TinyEditor to avoid SSR issues
const TinyEditor = dynamic(() => import('./TinyEditor'), {
    ssr: false,
    loading: () => <div className="min-h-[500px] bg-gray-800 rounded-md flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-400">Loading editor...</p>
        </div>
    </div>
});

// Client-side slug generation
const generateSlug = (title: string): string => {
    if (!title) return '';

    // Normalize Vietnamese characters to their non-accented versions
    const normalizedTitle = title
        .normalize('NFD')                    // Normalize to decomposed form
        .replace(/[\u0300-\u036f]/g, '')     // Remove all diacritics
        // Handle specific Vietnamese characters
        .replace(/[đĐ]/g, (match) => match === 'đ' ? 'd' : 'D')
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y');

    return normalizedTitle
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars (except -)
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

interface ModernPostFormProps {
    onSubmit: (data: PostFormValues) => Promise<void>;
    allCategories: Category[];
    allStocks: Stock[];
    isLoading?: boolean;
    submitButtonText?: string;
    initialData?: Partial<PostFormValues & { id?: string }>;
}

export const ModernPostForm: React.FC<ModernPostFormProps> = ({
    onSubmit,
    allCategories,
    allStocks,
    isLoading = false,
    submitButtonText = 'Đăng bài viết',
    initialData = {}
}) => {
    const router = useRouter();
    const isEditing = !!initialData.id;

    // Memoize form values để giảm re-render không cần thiết
    const memoizedFormValues = React.useMemo(() => {
        return {
            title: initialData?.title || '',
            slug: initialData?.slug || (initialData?.id ? '' : generateSlug(initialData?.title || '')),
            description: initialData?.description || '',
            content: initialData?.content || '',
            thumbnail: initialData?.thumbnail || null,
            category_id: initialData?.category_id || '',
            stock_id: initialData?.stock_id || null,
        };
    }, [initialData]);

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            content: '',
            thumbnail: null,
            category_id: undefined,
            stock_id: null,
        },
        values: memoizedFormValues,
        mode: 'onChange', // Thêm mode onChange để xác thực khi người dùng thay đổi giá trị
    });

    const { watch, setValue, getValues, formState: { dirtyFields } } = form;
    const watchedTitle = watch('title');

    // Thumbnail state
    const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState<string | null>(initialData?.thumbnail || null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
    const resolveImageSelectionRef = useRef<((value: string | null) => void) | null>(null);

    // Slug generation effect
    useEffect(() => {
        if (!initialData?.id && !dirtyFields.slug) {
            setValue('slug', generateSlug(watchedTitle), { shouldValidate: true });
        }
    }, [watchedTitle, initialData?.id, dirtyFields.slug, setValue]);

    // Effect to update thumbnail preview state
    useEffect(() => {
        setSelectedThumbnailUrl(initialData?.thumbnail || null);
    }, [initialData?.thumbnail]);

    // Image handling functions
    const handleImageSelect = (image: Image) => {
        setSelectedThumbnailUrl(image.url);
        setValue('thumbnail', image.url, { shouldValidate: true, shouldDirty: true });
        setIsImageModalOpen(false);
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
            toast.success('Tải ảnh lên thành công!');
        } catch (error: any) {
            toast.error('Tải ảnh lên thất bại', { description: error.message });
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

    // Function to trigger image library modal
    const handleShowImageLibrary = (): Promise<string | null> => {
        return new Promise((resolve) => {
            resolveImageSelectionRef.current = resolve;
            setIsImageModalOpen(true);
        });
    };

    // Callback for when an image is selected in the dialog
    const handleImageSelected = (image: Image | null) => {
        const imageUrl = image?.url || null;
        if (resolveImageSelectionRef.current) {
            resolveImageSelectionRef.current(imageUrl);
            resolveImageSelectionRef.current = null;
        }
        // Cập nhật thumbnail khi chọn ảnh từ thư viện
        if (image && imageUrl) {
            setSelectedThumbnailUrl(imageUrl);
            setValue('thumbnail', imageUrl, { shouldValidate: true, shouldDirty: true });
        }
        setIsImageModalOpen(false);
    };

    // Content change handler memoized để giảm thiểu re-render
    const handleContentChange = useCallback((value: string) => {
        setValue('content', value, { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    // Submit handler
    const handleSubmit = async (data: PostFormValues) => {
        await onSubmit(data);
    };

    return (
        <div className="bg-gray-900 rounded-xl shadow-xl">
            {/* Header section */}
            <div className="border-b border-gray-800 py-4 px-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-blue-500" />
                    {isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">Tạo nội dung chất lượng về phân tích thị trường chứng khoán</p>
            </div>

            <div className="p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Phần thông tin cơ bản */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Main content column */}
                            <div className="lg:col-span-2 space-y-4">
                                {/* Basic Information Card */}
                                <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-base text-gray-200">Thông tin chính</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pb-4">
                                        {/* Title field */}
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-200">Tiêu đề bài viết *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Nhập tiêu đề bài viết..."
                                                            {...field}
                                                            disabled={disableForm}
                                                            className="bg-gray-900 border-gray-700 text-gray-100"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Slug field */}
                                        <FormField
                                            control={form.control}
                                            name="slug"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-200">Đường dẫn (Slug)</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input
                                                                placeholder="duong-dan-bai-viet"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                disabled={disableForm}
                                                                className="flex-grow bg-gray-900 border-gray-700 text-gray-100"
                                                            />
                                                        </FormControl>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={regenerateSlug}
                                                            disabled={disableForm || !watchedTitle}
                                                            title="Tạo lại slug từ tiêu đề"
                                                            className="border-gray-700 bg-gray-800 hover:bg-gray-700"
                                                        >
                                                            <RefreshCw className="h-4 w-4 text-blue-400" />
                                                        </Button>
                                                    </div>
                                                    <FormDescription className="text-gray-400 text-xs">
                                                        Phần cuối URL của bài viết (tự động tạo, có thể chỉnh sửa).
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Description field */}
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-200">Mô tả ngắn</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Nhập mô tả ngắn gọn về bài viết..."
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            disabled={disableForm}
                                                            rows={2}
                                                            className="bg-gray-900 border-gray-700 text-gray-100 resize-none"
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-gray-400 text-xs">
                                                        Hiển thị trong danh sách bài viết và kết quả tìm kiếm.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Thumbnail Card - Compact version */}
                                <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader className="py-3 flex flex-row items-center justify-between">
                                        <CardTitle className="text-base text-gray-200 flex items-center gap-2">
                                            <ImagePlus className="h-4 w-4 text-blue-500" />
                                            Ảnh bìa
                                        </CardTitle>
                                        {selectedThumbnailUrl && (
                                            <div className="h-6 w-6 relative overflow-hidden rounded-sm">
                                                <NextImage
                                                    src={selectedThumbnailUrl}
                                                    alt="Thumbnail"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        <FormItem className="space-y-3">
                                            <FormControl>
                                                <Controller
                                                    name="thumbnail"
                                                    control={form.control}
                                                    render={({ field }) => (
                                                        <input type="hidden" {...field} value={field.value ?? ''} />
                                                    )}
                                                />
                                            </FormControl>
                                            
                                            <div className="flex gap-2">
                                                {/* Mini thumbnail preview */}
                                                <div className="w-[120px] h-[68px] bg-gray-900 rounded-md overflow-hidden border border-gray-700 relative flex-shrink-0">
                                                    {selectedThumbnailUrl ? (
                                                        <NextImage
                                                            src={selectedThumbnailUrl}
                                                            alt="Ảnh bìa bài viết"
                                                            fill
                                                            className="object-cover"
                                                            onError={(e) => { e.currentTarget.src = '/placeholder-image.png'; }}
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                                            <ImagePlus className="h-5 w-5 mb-1" />
                                                            <span className="text-xs">Chưa có ảnh</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Action buttons */}
                                                <div className="flex flex-col gap-2 flex-grow">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setIsImageModalOpen(true)}
                                                            disabled={disableForm}
                                                            className="text-xs h-8 flex-1 border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
                                                            size="sm"
                                                        >
                                                            Chọn ảnh
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            asChild
                                                            disabled={disableForm}
                                                            className="text-xs h-8 flex-1 border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
                                                            size="sm"
                                                        >
                                                            <label htmlFor="thumbnail-upload" className="flex items-center justify-center cursor-pointer">
                                                                {isUploading ? (
                                                                    <>
                                                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                        Đang tải...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Upload className="mr-1 h-3 w-3" />
                                                                        Tải lên
                                                                    </>
                                                                )}
                                                                <input
                                                                    id="thumbnail-upload"
                                                                    type="file"
                                                                    accept="image/*"
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
                                                                onClick={clearThumbnail}
                                                                className="text-xs h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 p-0 w-8"
                                                                disabled={disableForm}
                                                                size="sm"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <FormDescription className="text-gray-400 text-xs mt-1">
                                                        Ảnh bìa sẽ hiển thị ở trang chủ và danh sách bài viết.
                                                    </FormDescription>
                                                </div>
                                            </div>
                                            <FormMessage>{form.formState.errors.thumbnail?.message}</FormMessage>
                                        </FormItem>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                {/* Classification Settings */}
                                <Card className="bg-gray-800 border-gray-700">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-base text-gray-200 flex items-center gap-2">
                                            <BriefcaseBusiness className="h-4 w-4 text-blue-500" />
                                            Phân loại
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pb-4">
                                        {/* Category Select */}
                                        <FormField
                                            control={form.control}
                                            name="category_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-200">Danh mục *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={disableForm}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-100">
                                                                <SelectValue placeholder="Chọn danh mục" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                                                            {allCategories.length === 0 && <SelectItem value="loading-cats" disabled>Đang tải...</SelectItem>}
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

                                        {/* Stock Select */}
                                        <FormField
                                            control={form.control}
                                            name="stock_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-200">Mã cổ phiếu liên quan</FormLabel>
                                                    <Select
                                                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                                                        value={field.value ?? undefined}
                                                        disabled={disableForm}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-100">
                                                                <SelectValue placeholder="Chọn mã cổ phiếu (tùy chọn)" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-gray-800 border-gray-700 text-gray-100 max-h-[200px]">
                                                            <SelectItem value="none" className="text-gray-400">-- Không có --</SelectItem>
                                                            {allStocks && allStocks.length > 0 ? (
                                                                allStocks.map((stock) => (
                                                                    <SelectItem
                                                                        key={stock.id}
                                                                        value={stock.id}
                                                                        className="flex items-center"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-blue-400">{stock.symbol}</span>
                                                                            <span className="text-gray-400">|</span>
                                                                            <span className="truncate">{stock.name}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <SelectItem value="loading-stocks" disabled>Đang tải...</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription className="text-gray-400 text-xs">
                                                        Liên kết bài viết với một mã cổ phiếu cụ thể (nếu có).
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Submit button */}
                                <div>
                                    <Button
                                        type="submit"
                                        disabled={disableForm}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {disableForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {disableForm ? 'Đang xử lý...' : submitButtonText}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Content Editor - Full width */}
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader className="py-3">
                                <CardTitle className="text-base text-gray-200">Nội dung bài viết</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <TinyEditor
                                                    content={field.value ?? ''}
                                                    onChange={handleContentChange}
                                                    placeholder="Bắt đầu viết nội dung bài viết..."
                                                    disabled={disableForm}
                                                    onShowImageLibrary={handleShowImageLibrary}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </form>
                </Form>
            </div>

            {/* Image Selector Dialog */}
            {isImageModalOpen && (
                <ImageSelectorDialog
                    open={isImageModalOpen}
                    onOpenChange={setIsImageModalOpen}
                    onImageSelect={handleImageSelected}
                />
            )}
        </div>
    );
};

export default ModernPostForm; 