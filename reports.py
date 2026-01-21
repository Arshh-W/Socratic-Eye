from google import genai
def generate_session_report(session_id, api_key):
    """
    Queries the database for all 'mentor_messages' in a session 
    and asks Gemini to summarize the user's learning progress.
    USe a simpler gemini api call, which is fast and low cost, return the response.text
    """