import AuthForm from "@/components/AuthForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto flex max-w-md items-center px-4 py-16">
      <AuthForm mode="signin" next={next} />
    </div>
  );
}
