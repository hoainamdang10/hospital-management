// Force dynamic rendering for landing page to avoid prerender issues in Docker
export const dynamic = 'force-dynamic';

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
