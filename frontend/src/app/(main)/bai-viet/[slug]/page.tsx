import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { postService } from "@/services/postService";
import PostContent from "@/components/posts/post-content";

interface PostPageProps {
  params: {
    slug: string;
  };
}

// Helper function to get post by slug
async function getPostBySlug(slug: string) {
  try {
    // First get all posts to find ID by slug
    // Ideally the API would support fetching by slug directly
    const allPostsResponse = await postService.getAllPosts({
      limit: 1000, // Get a large number to search through
    });
    
    const post = allPostsResponse.data.find(p => p.slug === slug);
    
    if (!post) {
      return null;
    }
    
    // Now fetch the full post with all details
    return await postService.getPostById(post.id);
  } catch (error) {
    console.error(`Failed to fetch post data for slug: ${slug}`, error);
    return null;
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: "Bài viết không tồn tại",
    };
  }
  
  return {
    title: `${post.title} | Thị trường chứng khoán`,
    description: post.description || "Phân tích thị trường chứng khoán",
  };
}

export const revalidate = 3600; // Revalidate every hour

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        <div className="mb-8">
          {/* Breadcrumbs */}
          <div className="text-sm text-gray-400 mb-6">
            <Link href="/tin-tuc" className="hover:text-blue-400">Tin tức</Link>
            <span className="mx-2">›</span>
            <Link href={`/danh-muc/${post.category.slug}`} className="hover:text-blue-400">
              {post.category.title}
            </Link>
          </div>
          
          {/* Post title */}
          <h1 className="text-4xl font-bold text-gray-100 mb-4">{post.title}</h1>
          
          {/* Post metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            <div className="flex items-center">
              <span className="mr-1">Ngày đăng:</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
            
            {post.stock && (
              <div className="flex items-center">
                <span className="mr-1">Cổ phiếu liên quan:</span>
                <Link href={`/co-phieu/${post.stock.symbol}`} className="text-blue-400 hover:text-blue-300">
                  ${post.stock.symbol}
                </Link>
              </div>
            )}
          </div>
          
          {/* Post thumbnail */}
          {post.thumbnail && (
            <div className="relative h-80 w-full mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.thumbnail}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          
          {/* Post description */}
          {post.description && (
            <div className="mb-8 bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
              <p className="text-lg italic text-gray-300">{post.description}</p>
            </div>
          )}
          
          {/* Post content - Sử dụng Client Component */}
          <div className="prose prose-invert prose-lg max-w-none mb-12">
            {post.content ? (
              <PostContent content={post.content} />
            ) : (
              <p className="text-gray-400">Không có nội dung</p>
            )}
          </div>
        </div>
        
        {/* Author info */}
        <div className="bg-gray-800 p-6 rounded-lg mt-12 border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Tác giả</h2>
          <div className="text-gray-300">{post.user.full_name}</div>
        </div>
      </article>
    </div>
  );
} 