from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage
from langgraph.graph import StateGraph, END
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

# --------------------
# LLM Setup
# --------------------
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

# --------------------
# Diff Validation Function
# --------------------
def validate_diff(diff: str) -> bool:
    """Check if the diff is valid and non-empty"""
    if not diff or not diff.strip():
        return False
    
    # Basic check for diff format
    diff_lines = diff.strip().split('\n')
    if len(diff_lines) < 3:  # Too short to be a real diff
        return False
    
    # Check for common diff markers
    diff_markers = ['diff --git', '---', '+++', '@@']
    has_markers = any(marker in diff for marker in diff_markers)
    
    return has_markers

# --------------------
# Agent Definitions with Error Handling
# --------------------
class LintAndStyleAgent:
    def __init__(self):
        self.system_prompt = "You are a Lint & Style Checker. Review code for formatting, naming conventions, and style issues."
    
    async def analyze(self, diff: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Analyze this diff for code style issues:
            {diff}
            
            Return a JSON with: {{"score": 0-100, "issues": ["issue1", "issue2"]}}
            """
            response = await llm.agenerate([[HumanMessage(content=prompt)]])
            response_text = response.generations[0][0].text
            
            # Try to parse JSON, return default if fails
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                print(f"❌ JSON parse error in Lint agent: {response_text}")
                return {"score": 0, "issues": ["Failed to parse analysis"]}
                
        except Exception as e:
            print(f"❌ Lint agent error: {e}")
            return {"score": 0, "issues": ["Analysis failed"]}

class BugDetectionAgent:
    def __init__(self):
        self.system_prompt = "You are a Bug Detector. Analyze code for logical or functional bugs."
    
    async def analyze(self, diff: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Analyze this diff for potential bugs:
            {diff}
            
            Return a JSON with: {{"score": 0-100, "issues": ["issue1", "issue2"]}}
            """
            response = await llm.agenerate([[HumanMessage(content=prompt)]])
            response_text = response.generations[0][0].text
            
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                print(f"❌ JSON parse error in Bug agent: {response_text}")
                return {"score": 0, "issues": ["Failed to parse analysis"]}
                
        except Exception as e:
            print(f"❌ Bug agent error: {e}")
            return {"score": 0, "issues": ["Analysis failed"]}

class SecurityScannerAgent:
    def __init__(self):
        self.system_prompt = "You are a Security Scanner. Review code for vulnerabilities, secrets, or risky patterns."
    
    async def analyze(self, diff: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Analyze this diff for security issues:
            {diff}
            
            Return a JSON with: {{"score": 0-100, "issues": ["issue1", "issue2"]}}
            """
            response = await llm.agenerate([[HumanMessage(content=prompt)]])
            response_text = response.generations[0][0].text
            
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                print(f"❌ JSON parse error in Security agent: {response_text}")
                return {"score": 0, "issues": ["Failed to parse analysis"]}
                
        except Exception as e:
            print(f"❌ Security agent error: {e}")
            return {"score": 0, "issues": ["Analysis failed"]}

class PerformanceReviewAgent:
    def __init__(self):
        self.system_prompt = "You are a Performance Reviewer. Review code for inefficiencies or bottlenecks."
    
    async def analyze(self, diff: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Analyze this diff for performance issues:
            {diff}
            
            Return a JSON with: {{"score": 0-100, "issues": ["issue1", "issue2"]}}
            """
            response = await llm.agenerate([[HumanMessage(content=prompt)]])
            response_text = response.generations[0][0].text
            
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                print(f"❌ JSON parse error in Performance agent: {response_text}")
                return {"score": 0, "issues": ["Failed to parse analysis"]}
                
        except Exception as e:
            print(f"❌ Performance agent error: {e}")
            return {"score": 0, "issues": ["Analysis failed"]}

class CoordinatorAgent:
    def __init__(self):
        self.system_prompt = "You are a Coordinator Agent. Merge results from multiple code review agents."
    
    async def coordinate(self, results: Dict[str, Any]) -> Dict[str, Any]:
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
            """
            response = await llm.agenerate([[HumanMessage(content=prompt)]])
            response_text = response.generations[0][0].text
            
            # Try to parse JSON, return default if fails
            try:
                final_result = json.loads(response_text)
                
                # Convert all scores to integers
                final_result = self._ensure_integer_scores(final_result)
                
                # Ensure arrays are never empty objects
                if isinstance(final_result.get('comments'), dict):
                    final_result['comments'] = []
                if isinstance(final_result.get('fix_suggestions'), dict):
                    final_result['fix_suggestions'] = []
                
                return final_result
                
            except json.JSONDecodeError:
                print(f"❌ JSON parse error in Coordinator: {response_text}")
                return self._get_default_response()
                
        except Exception as e:
            print(f"❌ Coordinator agent error: {e}")
            return self._get_default_response()
    
    def _ensure_integer_scores(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure all scores are integers, not floats"""
        # Convert main score
        if 'score' in result:
            result['score'] = int(round(result['score']))
        
        # Convert category scores
        if 'categories' in result:
            for category in ['lint', 'bugs', 'security', 'performance']:
                if category in result['categories']:
                    result['categories'][category] = int(round(result['categories'][category]))
        
        return result
    
    def _get_default_response(self) -> Dict[str, Any]:
        """Return a default response when coordination fails"""
        return {
            "score": 0,
            "categories": {
                "lint": 0,
                "bugs": 0,
                "security": 0,
                "performance": 0
            },
            "summary": "Analysis failed due to an internal error.",
            "comments": [],
            "fix_suggestions": []
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
            "performance": state["performance_result"]
        }
        final_result = await agent.coordinate(results)
        return {"final_result": final_result}
    
    # Add nodes
    workflow.add_node("lint_agent", run_lint_agent)
    workflow.add_node("bug_agent", run_bug_agent)
    workflow.add_node("security_agent", run_security_agent)
    workflow.add_node("performance_agent", run_performance_agent)
    workflow.add_node("coordinator", run_coordinator)
    
    # Set entry point
    workflow.set_entry_point("lint_agent")
    
    # Define flow
    workflow.add_edge("lint_agent", "bug_agent")
    workflow.add_edge("bug_agent", "security_agent")
    workflow.add_edge("security_agent", "performance_agent")
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
        # Validate the diff before processing
        if not validate_diff(data.diff):
            # Return a default response for empty/invalid diffs
            return {
                "score": 0,
                "categories": {
                    "lint": 0,
                    "bugs": 0,
                    "security": 0,
                    "performance": 0
                },
                "summary": "No code changes detected or invalid diff provided.",
                "comments": [],
                "fix_suggestions": []
            }

        # Execute the graph with initial state
        initial_state = {
            "diff": data.diff,
            "lint_result": {},
            "bug_result": {},
            "security_result": {},
            "performance_result": {},
            "final_result": {}
        }
        
        results = await review_graph.ainvoke(initial_state)
        
        # Return the final result
        return results["final_result"]
        
    except Exception as e:
        print(f"❌ Critical error in analyze_diff: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# --------------------
# Health Check Endpoint
# --------------------
@app.get("/")
async def health_check():
    return {"status": "OK", "message": "AI Code Reviewer Service is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-code-reviewer"}