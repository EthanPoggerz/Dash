export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-3">DASH</h1>
        <p className="text-gray-400 mb-8">
          The all-in-one hub for schedules, attendance, and announcements.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/login" className="bg-blue-600 hover:bg-blue-700 transition rounded-lg px-6 py-3 text-sm font-medium">
            Log In
          </a>
          <a href="/signup" className="bg-gray-800 hover:bg-gray-700 transition rounded-lg px-6 py-3 text-sm font-medium border border-gray-700">
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}