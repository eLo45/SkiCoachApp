import Image from "next/image";

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-8">CMS Ski Video Analysis</h1>
        <Link href="/sidebyside" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
            Side by Side Video Analysis
        </Link>
      </div>
    </main>
  );
}

