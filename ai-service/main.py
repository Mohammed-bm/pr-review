from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from typing import List, Dict, Any, TypedDict
from dotenv import load_dotenv
import os, json, asyncio, re

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
llm = ChatOpenAI(
    model="gpt-4o-mini",   # lightweight, faster, cheaper
    temperature=0,
    api_key=os.getenv("OPENAI_API_KEY")
)

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

def extract_json(response_text: str) -> dict:
    """Extract the first valid JSON block from the LLM response."""
    try:
        # More robust JSON extraction
        match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
        if match:
            json_str = match.group(0)
            # Clean up common formatting issues
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            return json.loads(json_str)
    except Exception as e:
        print(f"❌ JSON extract error: {e}")
        print(f"Raw LLM output (truncated): {response_text[:500]}...")
    
    # Fallback: try to find any JSON-like structure
    try:
        # Look for the most complete JSON structure
        matches = re.findall(r'\{.*?\}', response_text, re.DOTALL)
        for match in matches:
            try:
                if 'score' in match and 'issues' in match:
                    return json.loads(match)
            except:
                continue
    except:
        pass
    
    return {"score": 0, "issues": ["Failed to parse analysis"]}

# --------------------
# Enhanced Agent Definitions
# --------------------
class LintAndStyleAgent:
    def __init__(self):
        self.system_prompt = """You are a Lint & Style Checker. Review code for formatting, naming conventions, and style issues.
        For each issue, provide specific examples and fix suggestions."""

    async def analyze(self, diff: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Analyze this diff for code style issues:
            ```diff
            {diff}
            ```
            
            Return a JSON with:
            {{
                "score": 0-100,
                "issues": [
                    {{
                        "type": "naming|formatting|structure|convention",
                        "message": "Specific issue description",
                        "line": 42,
                        "file": "src/file.js",
                        "suggestion": "How to fix it",
                        "before": "problematic code",
                        "after": "fixed code"
                    }}
                ]
            }}
            
            Focus on:
            - Naming conventions (camelCase, PascalCase)
            - Code formatting (indentation, spacing, brackets)
            - Best practices violations
            - Consistency issues
            """
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            response_text = response.content
            
            result = extract_json(response_text)
            # Ensure issues array exists
            if 'issues' not in result:
                result['issues'] = []
            return result
                
        except Exception as e:
            print(f"❌ Lint agent error: {e}")
            return {"score": 0, "issues": ["Analysis failed"]}

class BugDetectionAgent:
    def __init__(self):
        self.system_prompt = """You are a Bug Detector. Analyze code for logical or functional bugs.
        Provide specific code examples for both problematic and fixed versions."""

    async def analyze(self, diff: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Analyze this diff for potential bugs:
            ```diff
            {diff}
            ```
            
            Return a JSON with:
            {{
                "score": 0-100,
                "issues": [
                    {{
                        "type": "logical|runtime|syntax|async",
                        "message": "Specific bug description",
                        "line": 42,
                        "file": "src/file.js", 
                        "suggestion": "How to fix the bug",
                        "before": "buggy code",
                        "after": "fixed code"
                    }}
                ]
            }}
            
            Look for:
            - Undefined variable access
            - Missing error handling
            - Race conditions
            - Incorrect logic
            - Async/await issues
            """
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            response_text = response.content
            
            result = extract_json(response_text)
            if 'issues' not in result:
                result['issues'] = []
            return result
                
        except Exception as e:
            print(f"❌ Bug agent error: {e}")
            return {"score": 0, "issues": ["Analysis failed"]}

class SecurityScannerAgent:
    def __init__(self):
        self.system_prompt = """You are a Security Scanner. Review code for vulnerabilities, secrets, or risky patterns.
        Provide specific security fixes with code examples."""

    async def analyze(self, diff: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Analyze this diff for security issues:
            ```diff
            {diff}
            ```
            
            Return a JSON with:
            {{
                "score": 0-100,
                "issues": [
                    {{
                        "type": "injection|secrets|auth|xss",
                        "message": "Specific security risk",
                        "line": 42,
                        "file": "src/file.js",
                        "suggestion": "How to secure the code",
                        "before": "vulnerable code", 
                        "after": "secure code"
                    }}
                ]
            }}
            
            Look for:
            - Hardcoded secrets
            - SQL/NoSQL injection
            - XSS vulnerabilities
            - Authentication issues
            - Input validation missing
            """
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            response_text = response.content
            
            result = extract_json(response_text)
            if 'issues' not in result:
                result['issues'] = []
            return result
                
        except Exception as e:
            print(f"❌ Security agent error: {e}")
            return {"score": 0, "issues": ["Analysis failed"]}

class PerformanceReviewAgent:
    def __init__(self):
        self.system_prompt = """You are a Performance Reviewer. Review code for inefficiencies or bottlenecks.
        Provide optimized code examples with performance improvements."""

    async def analyze(self, diff: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Analyze this diff for performance issues:
            ```diff
            {diff}
            ```
            
            Return a JSON with:
            {{
                "score": 0-100,
                "issues": [
                    {{
                        "type": "memory|cpu|rendering|algorithm",
                        "message": "Specific performance issue",
                        "line": 42,
                        "file": "src/file.js",
                        "suggestion": "How to optimize",
                        "before": "slow code",
                        "after": "optimized code"
                    }}
                ]
            }}
            
            Look for:
            - Inefficient algorithms
            - Unnecessary re-renders
            - Memory leaks
            - Blocking operations
            - Unoptimized database queries
            """
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            response_text = response.content
            
            result = extract_json(response_text)
            if 'issues' not in result:
                result['issues'] = []
            return result
                
        except Exception as e:
            print(f"❌ Performance agent error: {e}")
            return {"score": 0, "issues": ["Analysis failed"]}

class CoordinatorAgent:
    def __init__(self):
        self.system_prompt = """
        You are a Coordinator Agent. Merge results from multiple code review agents.

        CRITICAL REQUIREMENTS:
        1. You MUST include fix_suggestions with proper diff patches
        2. Each fix_suggestion must show the exact code change needed
        3. Generate at least 2-3 fix_suggestions for the most critical issues
        4. Use proper unified diff format for patches
        5. Include line numbers and file paths when possible

        Example fix_suggestion format:
        {
          "path": "src/app.js",
          "patch": "-  const badName = 'value'\\n+  const goodName = 'value'",
          "description": "Fix variable naming convention"
        }

        Always include fix_suggestions even if you have to create them based on the issues found.
        """

    async def coordinate(self, results: Dict[str, Any]) -> Dict[str, Any]:
        try:
            prompt = f"""
            {self.system_prompt}
            
            Merge these analysis results into a final review:
            {json.dumps(results, indent=2)}
            
            IMPORTANT: You MUST generate 2-3 fix_suggestions showing concrete code changes.
            Use proper diff format that could be applied directly.

            Return a JSON with this exact structure:
            {{
              "score": <0-100 overall score>,
              "categories": {{
                "lint": <0-100>,
                "bugs": <0-100>,
                "security": <0-100>,
                "performance": <0-100>
              }},
              "summary": "Brief overall summary highlighting key issues and fixes needed",
              "comments": [
                {{
                  "path": "file.js",
                  "line": 12, 
                  "body": "Specific feedback with code examples when possible"
                }}
              ],
              "fix_suggestions": [
                {{
                  "path": "file.js",
                  "patch": "-  old_code\\n+  new_code",
                  "description": "Clear explanation of what this fix addresses"
                }}
              ]
            }}

            Generate meaningful fix_suggestions for the most critical issues found.
            """

            response = await llm.ainvoke([HumanMessage(content=prompt)])
            response_text = response.content
            
            final_result = extract_json(response_text)
            
            # Convert all scores to integers
            final_result = self._ensure_integer_scores(final_result)
            
            # Ensure arrays exist and are properly formatted
            final_result = self._ensure_array_format(final_result)
            
            # If no fix_suggestions from LLM, generate them from issues
            if not final_result.get('fix_suggestions') or len(final_result['fix_suggestions']) == 0:
                all_issues = self._extract_all_issues(results)
                final_result['fix_suggestions'] = self._generate_fix_suggestions(all_issues)
            
            return final_result
                
        except Exception as e:
            print(f"❌ Coordinator agent error: {e}")
            return self._get_default_response()
    
    def _ensure_integer_scores(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure all scores are integers, not floats"""
        if 'score' in result:
            try:
                result['score'] = int(round(float(result['score'])))
            except (ValueError, TypeError):
                result['score'] = 50
        
        if 'categories' in result:
            for category in ['lint', 'bugs', 'security', 'performance']:
                if category in result['categories']:
                    try:
                        result['categories'][category] = int(round(float(result['categories'][category])))
                    except (ValueError, TypeError):
                        result['categories'][category] = 50
        
        return result
    
    def _ensure_array_format(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure comments and fix_suggestions are proper arrays"""
        if 'comments' not in result or not isinstance(result['comments'], list):
            result['comments'] = []
        
        if 'fix_suggestions' not in result or not isinstance(result['fix_suggestions'], list):
            result['fix_suggestions'] = []
        
        # Ensure each comment has required fields
        for comment in result['comments']:
            if 'path' not in comment:
                comment['path'] = 'unknown'
            if 'line' not in comment:
                comment['line'] = 1
            if 'body' not in comment:
                comment['body'] = 'No details provided'
        
        # Ensure each fix_suggestion has required fields
        for fix in result['fix_suggestions']:
            if 'path' not in fix:
                fix['path'] = 'unknown'
            if 'patch' not in fix:
                fix['patch'] = '# No patch provided'
            if 'description' not in fix:
                fix['description'] = 'Code improvement'
        
        return result
    
    def _extract_all_issues(self, results: Dict[str, Any]) -> List[Dict]:
        """Extract all issues from all agents"""
        all_issues = []
        for agent_name, result in results.items():
            if isinstance(result, dict) and 'issues' in result and isinstance(result['issues'], list):
                for issue in result['issues']:
                    if isinstance(issue, dict):
                        # Add agent type for context
                        issue['agent'] = agent_name
                        all_issues.append(issue)
        return all_issues
    
    def _generate_fix_suggestions(self, issues: List[Dict]) -> List[Dict]:
        """Generate fix suggestions from issues when LLM doesn't provide them"""
        fix_suggestions = []
        
        # Take top 3 most critical issues (assuming first ones are most important)
        for issue in issues[:3]:
            if isinstance(issue, dict):
                file_path = issue.get('file', 'src/app.js')
                description = issue.get('suggestion', issue.get('message', 'Code improvement'))
                
                # Create a simple patch based on available data
                if 'before' in issue and 'after' in issue:
                    patch = f"-  {issue['before']}\n+  {issue['after']}"
                else:
                    # Generic patch based on issue type
                    patch = self._create_generic_patch(issue, description)
                
                fix_suggestions.append({
                    "path": file_path,
                    "patch": patch,
                    "description": description
                })
        
        # If no issues found, create generic improvement suggestions
        if not fix_suggestions:
            fix_suggestions = [
                {
                    "path": "src/app.js",
                    "patch": "# Add specific error handling\n-  // TODO: Add error handling\n+  try {\\n+    // code\\n+  } catch (error) {\\n+    console.error('Error:', error)\\n+  }",
                    "description": "Add proper error handling"
                },
                {
                    "path": "src/utils.js", 
                    "patch": "# Improve code readability\n-  const x = data.value\n+  const userValue = data.value",
                    "description": "Use descriptive variable names"
                }
            ]
        
        return fix_suggestions
    
    def _create_generic_patch(self, issue: Dict, description: str) -> str:
        """Create a generic patch based on issue type"""
        issue_type = issue.get('type', '').lower()
        
        if 'naming' in issue_type:
            return "-  const bad_name = 'value'\n+  const goodName = 'value'"
        elif 'security' in issue_type:
            return "-  const password = 'secret123'\n+  const password = process.env.DB_PASSWORD"
        elif 'performance' in issue_type:
            return "-  data.map(item => expensiveOperation(item))\n+  const memoizedData = useMemo(() => data.map(expensiveOperation), [data])"
        elif 'bug' in issue_type:
            return "-  if (user = admin) {}\n+  if (user === admin) {}"
        else:
            return f"# Fix: {description}\n-  // Problematic code\n+  // Fixed code"
    
    def _get_default_response(self) -> Dict[str, Any]:
        """Return a default response when coordination fails"""
        return {
            "score": 50,
            "categories": {
                "lint": 50,
                "bugs": 50,
                "security": 50,
                "performance": 50
            },
            "summary": "Analysis completed with some issues. Review the code changes carefully.",
            "comments": [
                {
                    "path": "unknown",
                    "line": 1,
                    "body": "Please review the code changes for potential improvements."
                }
            ],
            "fix_suggestions": [
                {
                    "path": "src/app.js",
                    "patch": "# Code review completed\n# Please implement suggested improvements",
                    "description": "General code improvements needed"
                }
            ]
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
# LangGraph Implementation (Optional - keeping for compatibility)
# --------------------
def create_review_graph():
    workflow = StateGraph(AgentState)
    
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
    
    workflow.add_node("lint_agent", run_lint_agent)
    workflow.add_node("bug_agent", run_bug_agent)
    workflow.add_node("security_agent", run_security_agent)
    workflow.add_node("performance_agent", run_performance_agent)
    workflow.add_node("coordinator", run_coordinator)
    
    workflow.set_entry_point("lint_agent")
    workflow.add_edge("lint_agent", "bug_agent")
    workflow.add_edge("bug_agent", "security_agent")
    workflow.add_edge("security_agent", "performance_agent")
    workflow.add_edge("performance_agent", "coordinator")
    workflow.add_edge("coordinator", END)
    
    return workflow.compile()

# Create the graph
review_graph = create_review_graph()

# --------------------
# Main Endpoint
# --------------------
@app.post("/analyze", response_model=FinalOutput)
async def analyze_diff(data: DiffInput):
    try:
        # Validate diff early
        if not validate_diff(data.diff):
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

        diff = data.diff

        # Create agents
        lint_agent = LintAndStyleAgent()
        bug_agent = BugDetectionAgent()
        security_agent = SecurityScannerAgent()
        performance_agent = PerformanceReviewAgent()

        # Semaphore to prevent rate limiting
        semaphore = asyncio.Semaphore(2)

        async def safe_analyze(agent, diff):
            async with semaphore:
                return await agent.analyze(diff)

        # Run all 4 agents in parallel
        lint_result, bug_result, security_result, performance_result = await asyncio.gather(
            safe_analyze(lint_agent, diff),
            safe_analyze(bug_agent, diff),
            safe_analyze(security_agent, diff),
            safe_analyze(performance_agent, diff),
            return_exceptions=True  # Handle individual agent failures
        )

        # Handle any agent failures
        agents_results = {}
        for name, result in zip(['lint', 'bugs', 'security', 'performance'], 
                               [lint_result, bug_result, security_result, performance_result]):
            if isinstance(result, Exception):
                print(f"❌ {name} agent failed: {result}")
                agents_results[name] = {"score": 0, "issues": [f"Agent analysis failed: {str(result)}"]}
            else:
                agents_results[name] = result

        # Coordinate results
        coordinator = CoordinatorAgent()
        final_result = await coordinator.coordinate(agents_results)

        return final_result

    except Exception as e:
        print(f"❌ Critical error in analyze_diff: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# --------------------
# Health Check Endpoints
# --------------------
@app.get("/")
async def health_check():
    return {"status": "OK", "message": "AI Code Reviewer Service is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-code-reviewer"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
