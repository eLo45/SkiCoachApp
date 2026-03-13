import Image from "next/image";

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-8">Side by Side Video Analysis</h1>
        <Link href="/sidebyside" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
            Side by Side Video Analysis
        </Link>
      </div>

      <div className="mt-16 text-left max-w-4xl w-full">
        <h2 className="text-3xl font-bold mb-6 text-center">How to Use</h2>
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">1. Select Videos:</h3>
          <p className="text-gray-400">
            Use the calendar or the folder list to select the desired ski video date. Click once on 2 videos and they will download and show up on the screen. When you wish to change the selected videos, navigate back to the video list and click on the current videos once more to unselect them, and click on and select a new set of videos to compare.
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">2. Align Videos for Analysis:</h3>
          <p className="text-gray-400">
            Use the sliders to align the videos at a desired point in the course. Click the “Mark Sync Point” button for each video to set the play points. You also have the ability to mark a second sync point for more detailed analysis; move the sliders to line the videos up at a new point, and mark the sync points once more to track comparisons in a shorter, bounded time period. Press the “Clear Sync Point” button to reset the sync points and select new ones.
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">3. Viewing Functions:</h3>
          <p className="text-gray-400">
            Once your videos are prepared, press the play button to start the videos from your sync point. Pause the video at a time of your choice and compare the videos. While a video is paused, you can use the arrow buttons to fast forward frames, 2 at a time, or 4 at a time, backwards or forwards. Resume the video to continue watching.
          </p>
        </div>
      </div>
    </main>
  );
}

