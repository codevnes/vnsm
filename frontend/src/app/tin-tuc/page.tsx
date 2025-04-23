import { Metadata } from "next";
import { categoryService } from "@/services/categoryService";
import { postService } from "@/services/postService";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tin tức | Thị trường chứng khoán",
  description: "Tin tức và phân tích về thị trường chứng khoán",
};

export const revalidate = 3600; // Revalidate every hour

async function getNewsData() {
  try {
    const categories = await categoryService.getAllCategories();
    
    // Get posts for each category (limited to 5 most recent)
    const categoriesWithPosts = await Promise.all(
      categories.map(async (category) => {
        const postsResponse = await postService.getAllPosts({
          categoryId: category.id,
          limit: 5,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        return {
          ...category,
          posts: postsResponse.data,
        };
      })
    );
    
    return categoriesWithPosts.filter(category => category.posts.length > 0);
  } catch (error) {
    console.error("Failed to fetch news data:", error);
    return [];
  }
}

export default async function NewsPage() {
  const categoriesWithPosts = await getNewsData();
  
  if (categoriesWithPosts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-gray-100">Tin tức chứng khoán</h1>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-300">Không có bài viết nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-100">Tin tức chứng khoán</h1>
      
      {categoriesWithPosts.map((category) => (
        <div key={category.id} className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-100">{category.title}</h2>
            <Link href={`/danh-muc/${category.slug}`} className="text-blue-400 hover:text-blue-300 text-sm">
              Xem tất cả
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.posts.map((post) => (
              <Card key={post.id} className="bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all overflow-hidden">
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
                <CardContent className="pb-2">
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
        </div>
      ))}
    </div>
  );
} 