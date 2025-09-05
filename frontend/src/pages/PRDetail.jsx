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

  if (loading) return <p className="p-4">Loading PR details...</p>;
  if (!pr) return <p className="p-4 text-red-500">PR not found</p>;

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
    </div>
  );
}
