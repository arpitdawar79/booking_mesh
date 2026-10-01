import FixForm from "./fix-form";

export default async function FixPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <FixForm token={token} />;
}
