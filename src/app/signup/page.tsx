import AuthForm from "@/components/AuthForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto flex max-w-md items-center px-4 py-16">
      <AuthForm mode="signup" next={next} />
    </div>
  );
}
