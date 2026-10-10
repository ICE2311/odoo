export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-4xl font-bold mb-4 text-red-600">401 - Unauthorized</h1>
      <p className="text-gray-600 mb-8">You do not have permission to view this page.</p>
      <a href="/login" className="text-blue-600 hover:underline">Log in</a>
    </div>
  );
}
