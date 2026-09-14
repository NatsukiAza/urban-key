import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-6 text-center dark:bg-[#060818]">
            <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
            <p className="mb-6 text-lg text-white-dark">The page you are looking for does not exist.</p>
            <Link href="/" className="btn btn-primary">
                Back to dashboard
            </Link>
        </div>
    );
}
