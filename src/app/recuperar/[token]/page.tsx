import { ResetClient } from "./ResetClient";

export const metadata = { title: "Nueva contraseña — ALMA LIMPIA" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetClient token={token} />;
}
