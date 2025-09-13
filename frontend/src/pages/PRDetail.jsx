// src/pages/PRDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPRDiff } from "../api/pr";

export default function PRDetail() {
  const { id } = useParams(); // matches :id in App.jsx
  const [pr, setPr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPR = async () => {
      try {
        const data = await getPRDiff(id);
        setPr(data);
      } catch (err) {
        console.error("❌ Error fetching PR detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPR();
  }, [id]);

if (loading) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        {/* Text */}
        <p className="mt-4 text-lg text-gray-200">Loading PR details...</p>
      </div>
    </div>
  );
}

if (!pr) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
      <p className="text-lg text-red-500">PR not found</p>
    </div>
  );
}

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Pull Request #{pr.prNumber}</h1>
      <p className="text-gray-500">Repo: {pr.repoName}</p>

      {/* AI Analysis Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">🤖 AI Analysis</h2>
        <p className="mt-2">Score: <strong>{pr.analysis?.score ?? "N/A"}</strong></p>
        <p className="mt-2">Summary: {pr.analysis?.summary ?? "No summary yet"}</p>

        {pr.analysis?.categories && (
          <div className="mt-4">
            <h3 className="font-semibold">Category Scores:</h3>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>Lint & Style: {pr.analysis.categories.lint ?? "N/A"}</li>
              <li>Bugs: {pr.analysis.categories.bugs ?? "N/A"}</li>
              <li>Security: {pr.analysis.categories.security ?? "N/A"}</li>
              <li>Performance: {pr.analysis.categories.performance ?? "N/A"}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Diff Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">📄 Diff</h2>
        <pre className="bg-gray-900 text-green-200 p-4 rounded mt-2 overflow-x-auto text-sm">
          {pr.diff ?? "No changes"}
        </pre>
      </div>

   {/* Inline Comments Section */}
<div className="mt-6">
  <h2 className="text-xl font-semibold">💬 Inline Comments</h2>
  {pr.analysis?.comments && pr.analysis.comments.length > 0 ? (
    <ul className="mt-2 list-disc list-inside space-y-2">
      {pr.analysis.comments.map((c, idx) => (
        <li key={idx} className="bg-gray-100 p-2 rounded text-sm">
          <strong>{c.path}:{c.line}</strong> — {c.body}
        </li>
      ))}
    </ul>
  ) : (
    <p className="mt-2 text-gray-500">No inline comments.</p>
  )}
</div>

{/* Fix Suggestions Section */}
<div className="mt-6">
  <h2 className="text-xl font-semibold">🛠 Fix Suggestions</h2>
  {pr.analysis?.fix_suggestions && pr.analysis.fix_suggestions.length > 0 ? (
    <div className="space-y-4 mt-2">
      {pr.analysis.fix_suggestions.map((s, idx) => (
        <div key={idx} className="bg-gray-900 text-green-200 p-4 rounded text-sm overflow-x-auto">
          <p className="font-semibold mb-2">File: {s.path}</p>
          <pre>{s.patch}</pre>
        </div>
      ))}
    </div>
  ) : (
    <p className="mt-2 text-gray-500">No fix suggestions.</p>
  )}
</div>


    </div>
  );
}
