import { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryService } from "@/services/categoryService";
import { postService } from "@/services/postService";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const categories = await categoryService.getAllCategories();
    const category = categories.find(cat => cat.slug === params.slug);
    
    if (!category) {
      return {
        title: "Danh mục không tồn tại",
      };
    }

    return {
      title: `${category.title} | Thị trường chứng khoán`,
      description: category.description || `Bài viết trong danh mục ${category.title}`,
    };
  } catch (error) {
    return {
      title: "Danh mục | Thị trường chứng khoán",
    };
  }
}

export const revalidate = 3600; // Revalidate every hour

async function getCategoryData(slug: string, page: number = 1) {
  try {
    // Get all categories to find the one with matching slug
    const categories = await categoryService.getAllCategories();
    const category = categories.find(cat => cat.slug === slug);
    
    if (!category) {
      return null;
    }
    
    // Get posts for this category with pagination
    const postsResponse = await postService.getAllPosts({
      categoryId: category.id,
      page,
      limit: 12,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    
    return {
      category,
      posts: postsResponse.data,
      pagination: postsResponse.pagination,
    };
  } catch (error) {
    console.error(`Failed to fetch category data for slug: ${slug}`, error);
    return null;
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const categoryData = await getCategoryData(params.slug, page);
  
  if (!categoryData) {
    notFound();
  }
  
  const { category, posts, pagination } = categoryData;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">{category.title}</h1>
        {category.description && (
          <p className="text-gray-400">{category.description}</p>
        )}
      </div>
      
      {posts.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-300">Không có bài viết nào trong danh mục này.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {posts.map((post) => (
              <Card key={post.id} className="bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all overflow-hidden h-full flex flex-col">
                <div className="relative h-48 w-full">
                  {post.thumbnail ? (
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500">Không có ảnh</span>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <Link href={`/bai-viet/${post.slug}`}>
                    <CardTitle className="text-lg font-medium text-gray-100 hover:text-blue-400 line-clamp-2">
                      {post.title}
                    </CardTitle>
                  </Link>
                </CardHeader>
                <CardContent className="pb-2 flex-grow">
                  <CardDescription className="text-gray-400 line-clamp-2">
                    {post.description || "Không có mô tả"}
                  </CardDescription>
                </CardContent>
                <CardFooter className="text-xs text-gray-500">
                  <div className="flex justify-between w-full">
                    <span>{formatDate(post.createdAt)}</span>
                    {post.stock && (
                      <Link href={`/co-phieu/${post.stock.symbol}`} className="text-blue-400 hover:text-blue-300">
                        ${post.stock.symbol}
                      </Link>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <nav className="flex space-x-2" aria-label="Pagination">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={`/danh-muc/${params.slug}?page=${pageNum}`}
                    className={`px-4 py-2 rounded-md ${
                      pageNum === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
} 