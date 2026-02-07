from google.genai import types
from google import genai
import base64

def get_interpreter_brief(client, processed_frame, session_signature):
    """
    The Interpreter Agent: Extracts code and identifies the bug.
    Returns a technical brief for the mentor agent.
    """
    
    interpreter_prompt = """You are a Static Code Analyzer AI. Your task is to analyze code from screenshots.

INSTRUCTIONS:
1. Carefully examine the image and extract ALL visible code
2. Identify the programming language
3. Analyze the code logic for potential issues:
   - Syntax errors
   - Logical flaws (off-by-one errors, incorrect conditions, etc.)
   - Runtime errors (null references, type mismatches, etc.)
   - Edge cases not handled
   - Algorithm inefficiencies
4. Provide a TECHNICAL BRIEF for a mentor (not the user)

OUTPUT FORMAT:
- Language: [detected language]
- Code Summary: [brief description of what the code does]
- Issues Found: [list specific problems with line numbers if visible]
- Severity: [Critical/Major/Minor/None]
- Recommendation: [guidance for the mentor on how to help the student]

RULES:
- Be technical and precise
- Reference specific line numbers when visible
- If no issues found, state "No obvious issues detected"
- Do NOT provide solutions or fixed code
- Focus on WHAT is wrong, not HOW to fix it
- This analysis is for a MENTOR, not the student
"""

    try:
        if not processed_frame or len(processed_frame) == 0:
            raise ValueError("Processed frame is empty or None")
        
        if not client:
            raise ValueError("Client is None - API not initialized")
        
        print(f"[Interpreter] Processing {len(processed_frame)} bytes")
        
        content = types.Content(
            role="user",
            parts=[
                types.Part.from_bytes(data=processed_frame, mime_type="image/jpeg"),
                types.Part(text=interpreter_prompt)
            ]
        )
        
        config = {
            "thinking_config": {
                "thinking_level": "HIGH",
                "include_thoughts": True
            },
            "temperature": 0.3,  
        }
        
        print("[Interpreter] Calling Gemini API...")
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=[content], 
            config=config
        )
        
        if not response:
            raise ValueError("API returned None response")
        
        if not hasattr(response, 'text') or not response.text:
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason'):
                    raise ValueError(f"Response blocked: {candidate.finish_reason}")
            raise ValueError("API response has no text content")
        
        print(f"[Interpreter] Received response: {len(response.text)} chars")
    
        new_signature = session_signature
        try:
            if hasattr(response, 'candidates') and len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    if len(candidate.content.parts) > 0:
                        part = candidate.content.parts[0]
                        if hasattr(part, 'thought_signature') and part.thought_signature:
                            if isinstance(part.thought_signature, bytes):
                                new_signature = base64.b64encode(part.thought_signature).decode('utf-8')
                            else:
                                new_signature = part.thought_signature
                            print("[Interpreter] Thought signature extracted")
        except (AttributeError, IndexError, TypeError) as sig_error:
            print(f"[Interpreter] Warning: Could not extract thought signature: {sig_error}")
            pass
        
        return response.text, new_signature
        
    except ValueError as ve:
        print(f"[Interpreter] Validation Error: {ve}")
        raise
        
    except Exception as e:
        import traceback
        
        error_type = type(e).__name__
        error_msg = str(e)
        
        print(f"[Interpreter] ERROR: {error_type}")
        print(f"[Interpreter] Message: {error_msg}")
        
        # Log specific error types for debugging
        if "429" in error_msg or "quota" in error_msg.lower():
            print("[Interpreter] QUOTA EXCEEDED - API rate limit hit")
        elif "400" in error_msg:
            print("[Interpreter] BAD REQUEST - Check config parameters")
        elif "401" in error_msg or "403" in error_msg:
            print("[Interpreter] AUTH ERROR - Check API key")
        elif "404" in error_msg:
            print("[Interpreter] MODEL NOT FOUND - Check model name")
        elif "503" in error_msg or "unavailable" in error_msg.lower():
            print("[Interpreter] SERVICE UNAVAILABLE - Google API overloaded")
        elif "timeout" in error_msg.lower():
            print("[Interpreter] TIMEOUT - Request took too long")
        
        print("[Interpreter] Full traceback:")
        traceback.print_exc()
        raise Exception(f"Interpreter failed: {error_type} - {error_msg[:200]}") from e