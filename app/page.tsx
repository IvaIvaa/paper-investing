export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">
        Paper Investing Platform
      </h1>

      <p className="text-gray-600 mb-6">
        Practice trading stocks with real market data — no real money.
      </p>

      <div className="flex gap-4">
        <a
          href="/register"
          className="px-6 py-2 bg-black text-white rounded"
        >
          Create Account
        </a>

        <a
          href="/login"
          className="px-6 py-2 border rounded"
        >
          Login
        </a>
      </div>
    </main>
  );
}
