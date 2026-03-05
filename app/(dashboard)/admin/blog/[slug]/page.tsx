import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BlogEditor from "../components/BlogEditor";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return db.blogPost.findUnique({
    where: { slug },
    include: { category: true },
  });
}

export default async function EditBlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const initialData = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    categoryId: post.categoryId,
    author: post.author,
    published: post.published,
  };

  return (
    <BlogEditor
      initialData={initialData}
      isEditing={true}
      originalSlug={slug}
    />
  );
}
