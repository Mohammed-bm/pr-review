from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# -----------------------------
# Input model for PR diff
# -----------------------------
class DiffInput(BaseModel):
    repo_name: str
    pr_number: int
    diff: str

# -----------------------------
# Output model for AI analysis response
# -----------------------------
class AnalysisOutput(BaseModel):
    repo_name: str
    pr_number: int
    summary: str

# -----------------------------
# Root health check
# -----------------------------
@app.get("/")
def root():
    return {"message": "AI Reviewer Service is running 🚀"}

# -----------------------------
# Analyze PR Diff (dummy for now)
# -----------------------------
@app.post("/analyze", response_model=AnalysisOutput)
def analyze_diff(data: DiffInput):
    """
    Dummy endpoint that simulates AI analysis.
    Later (Day 7–8), we’ll replace this with LangChain agents.
    """
    # Just count number of lines in diff for now
    line_count = len(data.diff.splitlines())

    return AnalysisOutput(
        repo_name=data.repo_name,
        pr_number=data.pr_number,
        summary=f"Received diff with {line_count} lines ✅"
    )
