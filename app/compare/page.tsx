import TimelineSync from '@/components/TimelineSync';
import Link from 'next/link';

export default function ComparePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-black text-white">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl font-bold text-center mb-8">
          Athlete Video Comparison
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <label htmlFor="video1" className="block mb-2 text-sm font-medium text-gray-300">Import Video 1</label>
            <input type="file" id="video1" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"/>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <label htmlFor="video2" className="block mb-2 text-sm font-medium text-gray-300">Import Video 2</label>
            <input type="file" id="video2" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
            <p className="text-gray-500">Video Player 1</p>
          </div>
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
            <p className="text-gray-500">Video Player 2</p>
          </div>
        </div>
        <TimelineSync />
        <div className="text-center mt-8">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                &larr; Back to Home
            </Link>
        </div>
      </div>
    </main>
  );
}
