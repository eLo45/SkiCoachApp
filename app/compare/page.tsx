import SyncSlider from '@/components/SyncSlider';
import Link from 'next/link';

export default function ComparePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-black text-white">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl font-bold text-center mb-8">
          Athlete Video Comparison
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
            <p className="text-gray-500">Video Player 1</p>
          </div>
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
            <p className="text-gray-500">Video Player 2</p>
          </div>
        </div>
        <SyncSlider />
        <div className="text-center mt-8">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                &larr; Back to Home
            </Link>
        </div>
      </div>
    </main>
  );
}
