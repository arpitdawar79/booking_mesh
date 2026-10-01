import GapsSweep from "./gaps-sweep";

export default async function SheetGapsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <GapsSweep token={token} />;
}
