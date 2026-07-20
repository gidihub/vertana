import { BlogEditor } from "@/components/cms/blog-editor"

export default async function CmsBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <BlogEditor postId={id} />
}
