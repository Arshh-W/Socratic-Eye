import os
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
# Correct Import for the modern SDK
from google import genai
from google.genai import types 
from dotenv import load_dotenv
#Gemini Configuration
load_dotenv()
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
    http_options=types.HttpOptions(api_version='v1alpha') 
)
GEMINI_MODEL = "gemini-2.5-flash"

# DATABASE QUERY
def fetch_mentor_messages(db: Session, session_id: str) -> List[str]:
    # Wrap raw SQL in text()
    query = text("""
        SELECT mentor_message
        FROM session_logs 
        WHERE session_id = :session_id
        ORDER BY timestamp ASC
    """)

    result = db.execute(query, {"session_id": session_id}).fetchall()
    return [row[0] for row in result]

# PROMPT BUILDER
def build_learning_report_prompt(messages: List[str]) -> str:
    chronological_messages = "\n".join(f"- {msg}" for msg in messages)

    return f"""
Act as a Senior Socratic Educator. Analyze this student's learning journey:
{chronological_messages}

Identify the specific Python errors they encountered (Syntax vs Logic).
Summarize their 'Growth Moment' in 2 sentences.

Output Format:
### Session Summary
...

### Concepts Mastered
- ...

### Next-Step Recommendations
- ...
""".strip()

# GEMINI CALL
def generate_learning_report(prompt: str) -> str:
    """
    Sends the prompt to Gemini Flash using the modern client.models.generate_content
    """
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=1000
        )
    )

    return response.text

def report_generation(db: Session, session_id: str) -> str:
    mentor_messages = fetch_mentor_messages(db, session_id)

    if not mentor_messages:
        return "No mentor messages found for this session."

    prompt = build_learning_report_prompt(mentor_messages)
    return generate_learning_report(prompt)