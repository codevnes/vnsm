'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Clock } from 'lucide-react';

import { Post } from '@/types/post';

interface LatestPostsProps {
  posts: Post[];
  isLoading: boolean;
}

const LatestPosts: React.FC<LatestPostsProps> = ({ posts, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="h-ful bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Tin tức mới nhất</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
              <Skeleton className="h-5 w-full mb-2" />
              <div className="flex items-center">
                <Skeleton className="h-4 w-24 mr-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="h-full bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Tin tức mới nhất</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Không có tin tức mới nhất.
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Card className="h-full bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Tin tức mới nhất</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
            <Link href={`/news/${post.id}`} className="block group">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2 line-clamp-2">
                {post.title}
              </h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>{formatDate(post.createdAt)}</span>
                {post.user && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{post.user.full_name}</span>
                  </>
                )}
              </div>
            </Link>
          </div>
        ))}
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Link href="/news" className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center hover:underline">
          Xem tất cả tin tức
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default LatestPosts;
