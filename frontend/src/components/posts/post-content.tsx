'use client';

import React from 'react';

interface PostContentProps {
  content: string;
}

export default function PostContent({ content }: PostContentProps) {
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: content }} 
      className="post-content"
    />
  );
} 