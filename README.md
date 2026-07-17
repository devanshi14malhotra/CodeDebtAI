to start running the application

open a terminal and do
cd frontend
npm install
npm run dev

open a second terminal and do 
create a virtual env using:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd backend
python -m uvicorn api:app --reload
