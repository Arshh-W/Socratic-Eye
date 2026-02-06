import os
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from google import genai
from google.genai import types 
from dotenv import load_dotenv

# Gemini Configuration
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(
    api_key=api_key,
    http_options=types.HttpOptions(api_version='v1alpha') 
)
GEMINI_MODEL = "gemini-2.5-flash" 

# DATABASE QUERY
def fetch_mentor_messages(db: Session, session_id: str) -> List[str]:
    query = text("""
        SELECT mentor_message
        FROM session_logs 
        WHERE session_id = :session_id
        ORDER BY timestamp ASC
    """)

    result = db.execute(query, {"session_id": session_id}).fetchall()
    return [row[0] for row in result]

# PROMPT Building
def build_learning_report_prompt(messages: List[str]) -> str:
    chronological_messages = "\n".join(f"- {msg}" for msg in messages)

    return f"""
Act as a Senior Socratic Educator. Analyze this student's learning journey and create a comprehensive report for the same.

MENTOR QUESTIONS ASKED DURING SESSION:
{chronological_messages}

YOUR TASK:
1. Identify the specific Python errors they encountered (Syntax vs Logic)
2. Summarize their 'Growth Moment' in 2-3 sentences
3. List the key concepts they worked on
4. Provide encouragement for their next session

REQUIRED OUTPUT FORMAT (complete all sections):
### Session Summary
[Write 2-3 sentences about their overall learning journey and progress]

### Challenges Encountered
[List the specific errors or bugs they worked through]

### Concepts Mastered
- [Concept 1]
- [Concept 2]
- [Continue as needed]

### Growth Moment
[Describe their breakthrough or key learning moment]

### Next Steps
[Suggest 1-2 things to practice or explore next]

IMPORTANT: Complete ALL sections. Do not truncate the response.
""".strip()

# GEMINI CALL
def generate_learning_report(prompt: str) -> str:
    """
    Sends the prompt to Gemini Flash using the modern client.models.generate_content
    """
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.5,  # Slightly higher for more creative summaries
                max_output_tokens=2048,  # Increased token limit
                top_p=0.95,
                top_k=40
            )
        )

        if not response or not response.candidates:
            print("ERROR: No candidates in Gemini response")
            return generate_fallback_report()
        
        candidate = response.candidates[0]
        if hasattr(candidate, 'finish_reason'):
            finish_reason = str(candidate.finish_reason)
            print(f"DEBUG: Gemini finish_reason: {finish_reason}")
            
            if 'SAFETY' in finish_reason:
                print("WARNING: Response blocked by safety filters")
                return """
### Session Summary
Your learning session was completed successfully.

### Note
The automated report generation encountered a content filter. Please review your session logs in the database for the complete interaction history.

### Concepts Worked On
Check the mentor messages in your session history to see what topics were covered.
                """.strip()
            
            elif 'MAX_TOKENS' in finish_reason or 'LENGTH' in finish_reason:
                print("WARNING: Response truncated due to length")
                partial_text = response.text if hasattr(response, 'text') else ""
                return partial_text + "\n\n*[Report was truncated. Session data is preserved in database.]*"
        
        if hasattr(response, 'text') and response.text:
            report_text = response.text.strip()
            
            # Verify the report has substantial content
            if len(report_text) < 100:
                print(f"WARNING: Report suspiciously short ({len(report_text)} chars)")
                return generate_fallback_report()
            
            return report_text
        else:
            print("ERROR: No text in Gemini response")
            return generate_fallback_report()

    except Exception as e:
        error_msg = str(e)
        print(f"ERROR: Gemini report generation error: {error_msg}")
        
        # Checking for specific error types
        if "429" in error_msg or "quota" in error_msg.lower():
            return """
### Session Summary
Your session completed successfully, but we've hit our AI quota limit.

### Action Required
Please try generating your report again in a few minutes. Your session data is safely stored.

**Session Status**: Completed
**Data**: Preserved in database
            """.strip()
        
        elif "503" in error_msg or "overloaded" in error_msg.lower():
            return """
### Session Summary
Your session completed successfully, but the AI service is temporarily overloaded.

### Action Required
Please try generating your report again in a moment. Your session data is safely stored.

**Session Status**: Completed
**Data**: Preserved in database
            """.strip()
        
        else:
            return f"""
### Session Summary
Your session completed, but we encountered an issue generating the detailed report.

**Error**: {error_msg[:200]}

### Your Data is Safe
All mentor interactions are preserved in the database. You can:
- Try regenerating the report
- Contact support with Session ID for manual report
- Review session logs directly in the database

**Tip**: This is usually a temporary issue with the AI service.
            """.strip()

def generate_fallback_report() -> str:#in case it doesn't work still let's have one for the safety measures
    """Generate a basic report when AI generation fails"""
    return """
### Session Summary
Your learning session has been completed and all interactions have been recorded.

### Report Generation Issue
We encountered a technical issue generating your detailed AI summary. However, all your session data is safely stored in the database.

### What You Can Do
1. Try refreshing and requesting the report again
2. Check your session history in the database
3. Contact support if this issue persists

### Data Status
✓ All mentor questions preserved
✓ Session logs intact
✓ Progress tracked successfully

**Note**: This is a temporary AI service issue and does not affect your learning progress.
    """.strip()

def report_generation(db: Session, session_id: str) -> str:
    """
    Main function to generate session report
    """
    try:
        print(f"DEBUG: Generating report for session {session_id}")
        mentor_messages = fetch_mentor_messages(db, session_id)

        if not mentor_messages:
            print("DEBUG: No mentor messages found")
            return """
### Session Summary
No mentor interactions were recorded during this session.

### Possible Reasons
- Session just started
- No code was analyzed yet
- Screen sharing wasn't active

### Next Steps
Make sure to:
1. Share your screen with the code editor
2. Wait for the AI to analyze your code
3. Interact with the Socratic mentor

**Tip**: The mentor will start asking questions once it sees your code!
            """.strip()

        print(f"DEBUG: Found {len(mentor_messages)} mentor messages")
        prompt = build_learning_report_prompt(mentor_messages)
        
        report = generate_learning_report(prompt)
        print(f"DEBUG: Report generated, length: {len(report)} chars")
        
        return report
        
    except Exception as e:
        error_msg = str(e)
        print(f"ERROR: Report generation error: {error_msg}")
        
        import traceback
        traceback.print_exc()
        
        return f"""
### Session Report Error
We encountered an issue accessing your session data.

**Error**: {error_msg[:200]}
**Session ID**: {session_id}

### Troubleshooting
1. Verify the session ID is correct
2. Check database connectivity
3. Ensure session_logs table exists

Please contact support if this persists.
        """.strip()