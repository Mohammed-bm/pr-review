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
        console.log("🔍 Raw PRs data:", data);
        setPrs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch PRs:", err);
        setPrs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPRs();
  }, []);

  // Mock data structure matching your image
  const mockPRs = [
    {
      _id: "1",
      repoName: "frontend-app",
      title: "Implement user profile page",
      score: 63,
      status: "App+week"
    },
    {
      _id: "2", 
      repoName: "api-microservice",
      title: "Add authentication middleware",
      score: 42,
      status: "Mwds RevIsNone"
    },
    {
      _id: "3",
      repoName: "data-pipeline", 
      title: "Optimize ETL process for large datasets",
      score: 93,
      status: "App+week"
    },
    {
      _id: "4",
      repoName: "docs",
      title: "Update README with new setup instructions", 
      score: 78,
      status: "Mwds RevIsNone"
    },
    {
      _id: "5",
      repoName: "design-system",
      title: "Refactor Button component",
      score: 68,
      status: "Mwds RevIsNone"
    },
    {
      _id: "6",
      repoName: "security-lib",
      title: "Fix XSS vulnerability in input sanitization",
      score: 92,
      status: "App+week"
    }
  ];

  const displayPRs = prs.length > 0 ? prs : mockPRs;

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner"></div>
      <p>Loading PRs...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">My Reviews</h1>
        <button onClick={handleLogout} className="logout-btn">
          [→] Logout
        </button>
      </header>

      {/* PRs Table - Full Width */}
      <section className="prs-section">
        <div className="table-header">
          <span>Repository</span>
          <span>Pull Request Title</span>
          <span>Score</span>
          <span>Status</span>
        </div>

        <div className="prs-list">
          {displayPRs.map((pr) => (
            <div key={pr._id} className="pr-item">
              <div className="repo-name">{pr.repoName}</div>
              <div className="pr-title">
                <Link to={`/pr/${pr.prNumber || pr._id}`}>
                  {pr.title}
                </Link>
              </div>
              <div className={`pr-score ${pr.score >= 80 ? 'high-score' : pr.score < 40 ? 'low-score' : ''}`}>
                {pr.score}%
              </div>
              <div className="pr-status">{pr.status}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}