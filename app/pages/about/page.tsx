import Link from 'next/link';
export default function about() {
  return (
    <div className="bg-gray-800 px-4 py-20 sm:py-24 text-center font-sans">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">About This App ℹ️</h1>
      <p className="mt-2 text-sm sm:text-base text-gray-300">This is a brand new page in my Next.js website!</p>
      <div className="mt-6">
        <Link href="/" className="text-blue-400 hover:underline text-sm sm:text-base">
          Go Back Home
        </Link>
      </div>
      <div className="mt-6">
        <Link href="/pages/about" className="text-blue-400 hover:underline text-sm sm:text-base">
          about
        </Link>
      </div>
      <div className="mt-6">
        <Link href="/pages/candidate-scoring" className="text-blue-400 hover:underline text-sm sm:text-base">
          candidate-scoring
        </Link>
      </div>
      <div className="mt-6">
        <Link href="/pages/interview-evaluation" className="text-blue-400 hover:underline text-sm sm:text-base">
          interview-evaluation
        </Link>
      </div>
      <div className="mt-6">
        <Link href="/pages/job-postings" className="text-blue-400 hover:underline text-sm sm:text-base">
          job-postings
        </Link>
      </div>
      <div className="mt-6">
        <Link href="/pages/login" className="text-blue-400 hover:underline text-sm sm:text-base">
          login
        </Link>
      </div>
      <div className="mt-6">
        <Link href="/pages/shortlisted-candidates" className="text-blue-400 hover:underline text-sm sm:text-base">
          shortlisted-candidates
        </Link>
      </div>
      <div className="mt-6">
        <Link href="/pages/setting" className="text-blue-400 hover:underline text-sm sm:text-base">
          setting
        </Link>
      </div>
      
    </div>
  );
}