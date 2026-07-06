from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import List, Dict, Any, TypedDict
from dotenv import load_dotenv
import os, json, asyncio

load_dotenv()

app = FastAPI(title="AI Code Reviewer - LangGraph Implementation")

# --------------------
# Input / Output Models
# --------------------
class DiffInput(BaseModel):
    repo_name: str
    pr_number: int
    diff: str


class FinalOutput(BaseModel):
    score: int
    categories: dict
    summary: str
    comments: list
    fix_suggestions: list

class Issue(BaseModel):
    path: str
    line: int
    body: str

from pydantic import BaseModel


class Comment(BaseModel):
    path: str
    line: int
    body: str


class FixSuggestion(BaseModel):
    path: str
    patch: str


class Categories(BaseModel):
    lint: int
    bugs: int
    security: int
    performance: int


class CoordinatorResult(BaseModel):
    score: int
    categories: Categories
    summary: str
    comments: list[Comment]
    fix_suggestions: list[FixSuggestion]

class AgentResult(BaseModel):
    score: int
    issues: List[Issue]

class AgentState(TypedDict, total=False):
    diff: str
    lint_result: Dict[str, Any]
    bug_result: Dict[str, Any]
    security_result: Dict[str, Any]
    performance_result: Dict[str, Any]
    final_result: Dict[str, Any]

# --------------------
# LLM Setup
# --------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-flash-lite-latest",  # lightweight, faster, cheaper
    temperature=0,
    google_api_key=os.getenv("GOOGLE_API_KEY"),
)

structured_llm = llm.with_structured_output(AgentResult)

# --------------------
# Diff Validation Function
# --------------------
def validate_diff(diff: str) -> bool:
    """Check if the diff is valid and non-empty"""
    if not diff or not diff.strip():
        return False

    # Basic check for diff format
    diff_lines = diff.strip().split("\n")
    if len(diff_lines) < 3:  # Too short to be a real diff
        return False

    # Check for common diff markers
    diff_markers = ["diff --git", "---", "+++", "@@"]
    has_markers = any(marker in diff for marker in diff_markers)

    return has_markers

# --------------------
# Agent Definitions with Error Handling
# --------------------
class LintAndStyleAgent:
    def __init__(self):
        self.system_prompt = (
            "You are a Lint & Style Checker. Review code for formatting, "
            "naming conventions, and style issues."
        )


    async def analyze(self, diff: str) -> Dict[str, Any]:
        print("RUNNING LINT")
        try:
            prompt = f"""
            {self.system_prompt}

            Diff to review:
            {diff}

            Find style issues in the diff.

            For each issue provide:
            - path
            - line
            - body

            Return all findings.

            Rules:
            - Only use file paths that appear after "diff --git a/... b/..." or "+++ b/..." lines.
            - Only use line numbers that literally appear in or can be directly counted from the diff hunks (@@ -x,y +a,b @@ lines). Count added/context lines starting from the "+" side start number.
            - If no issues are found, return an empty "issues" list.
            - Return ONLY valid JSON, no extra commentary.
            """

            result = await structured_llm.ainvoke(
                [HumanMessage(content=prompt)]
            )

            return result.model_dump()

        except Exception as e:
            print(f"❌ Lint agent error: {e}")
            return {"score": 0, "issues": []}


class BugDetectionAgent:
    def __init__(self):
        self.system_prompt = (
            "You are a Bug Detector. Analyze code for logical or functional bugs."
        )


    async def analyze(self, diff: str) -> Dict[str, Any]:
        print("RUNNING BUG")
        try:
            prompt = f"""
            {self.system_prompt}

            Diff to review:
            {diff}

            For each potential bug found, return JSON in this exact shape:
            {{
            "score": 0-100,
            "issues": [
                {{"path": "file.js", "line": 12, "body": "issue description"}}
            ]
            }}

            Rules:
            - Only use file paths that appear after "diff --git a/... b/..." or "+++ b/..." lines.
            - Only use line numbers that literally appear in or can be directly counted from the diff hunks (@@ -x,y +a,b @@ lines). Count added/context lines starting from the "+" side start number.
            - If no bugs are found, return an empty "issues" list.
            - Return ONLY valid JSON, no extra commentary.
            """

            result = await structured_llm.ainvoke(
                [HumanMessage(content=prompt)]
            )

            return result.model_dump()

        except Exception as e:
            print(f"❌ Bug agent error: {e}")
            return {"score": 0, "issues": []}


class SecurityScannerAgent:
    def __init__(self):
        self.system_prompt = (
            "You are a Security Scanner. Review code for vulnerabilities, "
            "secrets, or risky patterns."
        )

    async def analyze(self, diff: str) -> Dict[str, Any]:
        print("RUNNING SECURITY")
        try:
            prompt = f"""
            {self.system_prompt}

            Diff to review:
            {diff}

            For each security issue found, return JSON in this exact shape:
            {{
            "score": 0-100,
            "issues": [
                {{"path": "file.js", "line": 12, "body": "issue description"}}
            ]
            }}

            Rules:
            - Only use file paths that appear after "diff --git a/... b/..." or "+++ b/..." lines.
            - Only use line numbers that literally appear in or can be directly counted from the diff hunks (@@ -x,y +a,b @@ lines). Count added/context lines starting from the "+" side start number.
            - If no issues are found, return an empty "issues" list.
            - Return ONLY valid JSON, no extra commentary.
            """

            result = await structured_llm.ainvoke(
                [HumanMessage(content=prompt)]
            )

            return result.model_dump()

        except Exception as e:
            print(f"❌ Security agent error: {e}")
            return {"score": 0, "issues": []}


class PerformanceReviewAgent:
    def __init__(self):
        self.system_prompt = (
            "You are a Performance Reviewer. Review code for inefficiencies "
            "or bottlenecks."
        )

    async def analyze(self, diff: str) -> Dict[str, Any]:
        print("RUNNING PERFORMANCE")
        try:
            prompt = f"""
            {self.system_prompt}

            Diff to review:
            {diff}

            For each performance issue found, return JSON in this exact shape:
            {{
            "score": 0-100,
            "issues": [
                {{"path": "file.js", "line": 12, "body": "issue description"}}
            ]
            }}

            Rules:
            - Only use file paths that appear after "diff --git a/... b/..." or "+++ b/..." lines.
            - Only use line numbers that literally appear in or can be directly counted from the diff hunks (@@ -x,y +a,b @@ lines). Count added/context lines starting from the "+" side start number.
            - If no issues are found, return an empty "issues" list.
            - Return ONLY valid JSON, no extra commentary.
            """

            result = await structured_llm.ainvoke(
                [HumanMessage(content=prompt)]
            )

            return result.model_dump()

        except Exception as e:
            print(f"❌ Performance agent error: {e}")
            return {"score": 0, "issues": []}

class CoordinatorAgent:
    def __init__(self):
        self.system_prompt = """
        You are a Coordinator Agent. Merge results from multiple code review agents.
        Each agent has already provided real "path" and "line" values grounded in the diff.
        Do not invent or change any path/line values — just merge, deduplicate, and summarize.
        """


    async def coordinate(self, results: Dict[str, Any]) -> Dict[str, Any]:
        print("RUNNING COORDINATOR")
        try:
            prompt = f"""
            {self.system_prompt}

            Merge these analysis results into a final review:
            {json.dumps(results, indent=2)}

            Return a JSON with this exact structure:
            {{
            "score": <0-100 overall score (INTEGER ONLY)>,
            "categories": {{
                "lint": <0-100 INTEGER>,
                "bugs": <0-100 INTEGER>,
                "security": <0-100 INTEGER>,
                "performance": <0-100 INTEGER>
            }},
            "summary": "short overall summary",
            "comments": [
                {{ "path": "file.js", "line": 12, "body": "feedback" }}
            ],
            "fix_suggestions": [
                {{ "path": "file.js", "patch": "diff/udiff..." }}
            ]
            }}

            Rules:
            - Take "comments" directly from each agent's "issues" list — copy their "path" and "line" values exactly, do not recalculate or guess new ones.
            - If two agents report the same path+line, merge their "body" text into one comment rather than duplicating.
            - "fix_suggestions" can still be generated by you based on the merged issues.
            """

            structured_llm = llm.with_structured_output(CoordinatorResult)

            result = await structured_llm.ainvoke(
                [HumanMessage(content=prompt)]
            )

            final_result = result.model_dump()

            final_result = self._ensure_integer_scores(final_result)

            return final_result

        except Exception as e:
            print(f"❌ Coordinator agent error: {e}")
            return self._get_default_response()

    def _ensure_integer_scores(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure all scores are integers, not floats"""
        # Convert main score
        if "score" in result:
            result["score"] = int(round(result["score"]))

        # Convert category scores
        if "categories" in result:
            for category in ["lint", "bugs", "security", "performance"]:
                if category in result["categories"]:
                    result["categories"][category] = int(
                        round(result["categories"][category])
                    )

        return result

    def _get_default_response(self) -> Dict[str, Any]:
        """Return a default response when coordination fails"""
        return {
            "score": 0,
            "categories": {
                "lint": 0,
                "bugs": 0,
                "security": 0,
                "performance": 0,
            },
            "summary": "Analysis failed due to an internal error.",
            "comments": [],
            "fix_suggestions": [],
        }


# --------------------
# State Definition for LangGraph
# --------------------
class AgentState(TypedDict):
    diff: str
    lint_result: Dict[str, Any]
    bug_result: Dict[str, Any]
    security_result: Dict[str, Any]
    performance_result: Dict[str, Any]
    final_result: Dict[str, Any]


# --------------------
# LangGraph Implementation
# --------------------
def create_review_graph():
    # Use StateGraph instead of Graph
    workflow = StateGraph(AgentState)

    # Define nodes with proper state handling
    async def run_lint_agent(state: AgentState):
        agent = LintAndStyleAgent()
        result = await agent.analyze(state["diff"])
        return {"lint_result": result}

    async def run_bug_agent(state: AgentState):
        agent = BugDetectionAgent()
        result = await agent.analyze(state["diff"])
        return {"bug_result": result}

    async def run_security_agent(state: AgentState):
        agent = SecurityScannerAgent()
        result = await agent.analyze(state["diff"])
        return {"security_result": result}

    async def run_performance_agent(state: AgentState):
        agent = PerformanceReviewAgent()
        result = await agent.analyze(state["diff"])
        return {"performance_result": result}

    async def run_coordinator(state: AgentState):
        agent = CoordinatorAgent()

        results = {
            "lint": state["lint_result"],
            "bugs": state["bug_result"],
            "security": state["security_result"],
            "performance": state["performance_result"],
        }

        final_result = await agent.coordinate(results)
        return {"final_result": final_result}

    # Add nodes
    workflow.add_node("lint_agent", run_lint_agent)
    workflow.add_node("bug_agent", run_bug_agent)
    workflow.add_node("security_agent", run_security_agent)
    workflow.add_node("performance_agent", run_performance_agent)
    workflow.add_node("coordinator", run_coordinator)

    # Fan out from START to all review agents
    workflow.add_edge(START, "lint_agent")
    workflow.add_edge(START, "bug_agent")
    workflow.add_edge(START, "security_agent")
    workflow.add_edge(START, "performance_agent")

    # Fan in to coordinator
    workflow.add_edge("lint_agent", "coordinator")
    workflow.add_edge("bug_agent", "coordinator")
    workflow.add_edge("security_agent", "coordinator")
    workflow.add_edge("performance_agent", "coordinator")

    workflow.add_edge("coordinator", END)

    return workflow.compile()


# Create the graph
review_graph = create_review_graph()

# --------------------
# Endpoint with Validation
# --------------------
@app.post("/analyze", response_model=FinalOutput)
async def analyze_diff(data: DiffInput):
    try:
        # ✅ 1. Validate diff early
        if not validate_diff(data.diff):
            return {
                "score": 0,
                "categories": {
                    "lint": 0,
                    "bugs": 0,
                    "security": 0,
                    "performance": 0,
                },
                "summary": "No code changes detected or invalid diff provided.",
                "comments": [],
                "fix_suggestions": [],
            }

        diff = data.diff

        initial_state = {
            "diff": diff,
            "lint_result": {},
            "bug_result": {},
            "security_result": {},
            "performance_result": {},
            "final_result": {},
        }

        final_state = await review_graph.ainvoke(initial_state)

        return final_state["final_result"]

    except Exception as e:
        print(f"❌ Critical error in analyze_diff: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}",
        )


# --------------------
# Health Check Endpoint
# --------------------
@app.get("/")
async def health_check():
    return {
        "status": "OK",
        "message": "AI Code Reviewer Service is running!",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ai-code-reviewer",
    }