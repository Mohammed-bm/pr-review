// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { getPRs } from "../api/pr";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

useEffect(() => {
  const fetchPRs = async () => {
    try {
      const data = await getPRs();
      console.log("🔍 Raw PRs data:", data); // debug
      setPrs(Array.isArray(data) ? data : []); // ✅ ensure always an array
    } catch (err) {
      console.error("Failed to fetch PRs:", err);
      setPrs([]); // ✅ still set to empty array
    } finally {
      setLoading(false);
    }
  };
  fetchPRs();
}, []);

  if (loading) return <p className="p-4">Loading PRs...</p>;

  return (
    <div className="p-6 min-h-screen">
      {/* 🔹 Logout button fixed in top-right of viewport */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-md hover:bg-red-600"
      >
        Logout
      </button>

      <h1 className="text-2xl font-bold mb-4">Pull Requests</h1>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">PR Number</th>
            <th className="border px-4 py-2">Repo</th>
            <th className="border px-4 py-2">Author</th>
            <th className="border px-4 py-2">Score</th>
            <th className="border px-4 py-2">Summary</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {prs.map((pr) => (
            <tr key={pr._id}>
              <td className="border px-4 py-2">{pr.prNumber}</td>
              <td className="border px-4 py-2">{pr.repoName}</td>
              <td className="border px-4 py-2">{pr.author}</td>
              <td className="border px-4 py-2">{pr.score ?? "-"}</td>
              <td className="border px-4 py-2">{pr.summary ?? "Pending"}</td>
              <td className="border px-4 py-2">
                <Link
                  to={`/pr/${pr.prNumber}`}
                  className="text-blue-600 underline"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
