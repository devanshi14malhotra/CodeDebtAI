import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Path Routing ---
# Add the multi-agent directory to the Python path so we can import the agents
current_dir = os.path.dirname(os.path.abspath(__file__))
multi_agent_dir = os.path.join(current_dir, "..", "multi-agent")
sys.path.append(multi_agent_dir)

# Now we can import from multi-agent
from orchestrator import run_pipeline
from code_fixing_agent import fix_file
from shared_models import FixRequest
from config import TEMP_CLONE_DIR

# --- App Setup ---
app = FastAPI(title="Code Debt Analyzer API")

# Add CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. In production, change to specific frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for API Requests ---
class AnalyzeRequest(BaseModel):
    repo_url: str

class APIFixRequest(BaseModel):
    repo_url: str
    file_path: str
    issue_reason: str

# --- Endpoints ---

@app.post("/analyze")
def analyze_repo(request: AnalyzeRequest):
    """
    Analyzes a GitHub repository for technical debt and returns a prioritized report.
    """
    try:
        # run_pipeline returns (ReportOutput, repo_path)
        report, repo_path = run_pipeline(request.repo_url)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fix")
def fix_code_debt(request: APIFixRequest):
    """
    Generates an LLM-suggested fix for a specific flagged file.
    """
    try:
        # Reconstruct the local repository path
        repo_name = request.repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        repo_path = os.path.join(TEMP_CLONE_DIR, repo_name)
        
        if not os.path.exists(repo_path):
            raise HTTPException(status_code=400, detail="Repository not found locally. Run /analyze first.")

        # Create the internal FixRequest model expected by the agent
        internal_request = FixRequest(
            file_path=request.file_path,
            issue_reason=request.issue_reason
        )
        
        # Call the Code Fixing Agent
        fix_response = fix_file(internal_request, repo_path)
        return fix_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
