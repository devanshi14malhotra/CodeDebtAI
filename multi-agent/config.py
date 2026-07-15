from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

TEMP_CLONE_DIR = os.path.join(os.getcwd(), "temp_repos")
CHURN_LOOKBACK_MONTHS = 6
HIGH_COMPLEXITY_THRESHOLD = "A"     # radon grade C or worse = "high complexity"
HIGH_CHURN_THRESHOLD = 1           # commits in lookback period
UNTOUCHED_DAYS_THRESHOLD = 1      # ~6 months untouched
TOP_N_FILES = 20                    # only deep-analyze top 20 riskiest files

LLM_MODEL = "llama-3.3-70b-versatile"