import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPRDiff } from "../api/pr";

export default function PRDetail() {
  const { id } = useParams();
  const [pr, setPr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPR = async () => {
      try {
        const data = await getPRDiff(id);
        console.log("🔍 PR Detail Data:", data); // Debug log to see actual API response
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
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading PR details...</p>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="dashboard-loading">
        <p className="text-red-400">PR not found</p>
      </div>
    );
  }

  // Use the exact same data structure from your API
  const analysis = pr.analysis || {};
  const categories = analysis.categories || {};

  return (
    <div className="prdetail-container">
      {/* Header */}
      <header className="prdetail-header">
        <h1 className="prdetail-title">
          Pull Request #{pr.prNumber}
        </h1>
        <div className="prdetail-repo">
          Repository: <span className="repo-name">{pr.repoName}</span>
        </div>
      </header>

      {/* Overall Score */}
      <section className="overall-score-section">
        <h2>Overall AI Score</h2>
        <p className="score-subtitle">Automated review quality assessment</p>
        <div className="score-circle">
          <span className="score-value">{analysis.score ?? "N/A"}</span>
        </div>
      </section>

      <div className="prdetail-divider"></div>

      {/* Category Scores */}
      <section className="category-scores">
        <h2>Category Scores</h2>
        <div className="scores-grid">
          <div className="score-card">
            <h3>Lint & Style</h3>
            <div className="score-percent">{categories.lint ?? "N/A"}</div>
            <p className="score-description">
              {categories.lint >= 70 
                ? "Minor inconsistencies detected, but overall clean."
                : categories.lint >= 40
                ? "Several style issues need attention."
                : "Major style and linting issues detected."}
            </p>
          </div>
          
          <div className="score-card">
            <h3>Bug Detection</h3>
            <div className="score-percent">{categories.bugs ?? "N/A"}</div>
            <p className="score-description">
              {categories.bugs >= 70 
                ? "No critical bugs detected."
                : categories.bugs >= 40
                ? "Some potential issues identified."
                : "Critical bugs requiring immediate attention."}
            </p>
          </div>
          
          <div className="score-card">
            <h3>Security</h3>
            <div className="score-percent">{categories.security ?? "N/A"}</div>
            <p className="score-description">
              {categories.security >= 70 
                ? "No security vulnerabilities found."
                : categories.security >= 40
                ? "Minor security concerns identified."
                : "Critical security vulnerabilities detected."}
            </p>
          </div>
          
          <div className="score-card">
            <h3>Performance</h3>
            <div className="score-percent">{categories.performance ?? "N/A"}</div>
            <p className="score-description">
              {categories.performance >= 70 
                ? "Good performance with minor optimizations possible."
                : categories.performance >= 40
                ? "Performance improvements recommended."
                : "Significant performance issues detected."}
            </p>
          </div>
        </div>
      </section>

      <div className="prdetail-divider"></div>

      {/* AI Summary */}
      <section className="ai-summary">
        <h2>AI Summary</h2>
        <p className="summary-text">{analysis.summary ?? "No summary yet"}</p>
      </section>

      <div className="prdetail-divider"></div>

      {/* Diff Section */}
      {pr.diff && (
        <section className="inline-comments">
          <h2>Code Changes</h2>
          <div className="comment-card">
            <div className="code-block">
              <pre className="code-content">
                <code>{pr.diff}</code>
              </pre>
            </div>
          </div>
        </section>
      )}

      <div className="prdetail-divider"></div>

      {/* Inline Comments */}
      <section className="inline-comments">
        <h2>Inline Comments</h2>
        
        {analysis.comments && analysis.comments.length > 0 ? (
          analysis.comments.map((comment, idx) => (
            <div key={idx} className="comment-card">
              <div className="comment-header">
                <span className="reviewer-name">{comment.path}:{comment.line}</span>
              </div>
              
              <div className="comment-content">
                <p className="comment-description">{comment.body}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="comment-card">
            <div className="comment-content">
              <p className="comment-description">No inline comments.</p>
            </div>
          </div>
        )}
      </section>

      {/* Fix Suggestions */}
      {analysis.fix_suggestions && analysis.fix_suggestions.length > 0 ? (
        <>
          <div className="prdetail-divider"></div>
          <section className="inline-comments">
            <h2>Fix Suggestions</h2>
            {analysis.fix_suggestions.map((suggestion, idx) => (
              <div key={idx} className="comment-card">
                <div className="comment-header">
                  <span className="reviewer-name">File: {suggestion.path}</span>
                </div>
                <div className="comment-content">
                  <div className="code-block">
                    <pre className="code-content">
                      <code>{suggestion.patch}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      ) : (
        <>
          <div className="prdetail-divider"></div>
          <section className="inline-comments">
            <h2>Fix Suggestions</h2>
            <div className="comment-card">
              <div className="comment-content">
                <p className="comment-description">No fix suggestions.</p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="prdetail-footer">
        <p className="made-with">Made with CodeSage AI</p>
      </footer>
    </div>
  );
}