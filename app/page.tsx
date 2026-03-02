import Image from "next/image";

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Ski Coach Video Analysis</h1>
        <p className="text-xl text-gray-400 mb-8">Initial Setup</p>
        <Link href="/compare" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
            Go to Video Comparison Page
        </Link>
      </div>
    </main>
  );
}

