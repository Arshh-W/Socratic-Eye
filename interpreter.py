from google.genai import types
from google import genai

def get_interpreter_brief(client, processed_frame, session_signature):
    """
    The Interpreter Agent: Extracts code and identifies the bug.
    """
    
    # Define the prompt specifically for the Interpreter
    interpreter_prompt = """
    Act as a Static Code Analyzer.
    1. Extract the code from the image.
    2. Identify the logical flaw (off-by-one, syntax, connection error).
    3. Provide a technical brief for a mentor.
    RULES: Technical only. Do not talk to the user.
    """

    # 1. Use 'processed_frame' (the variable passed into the function)
    content = types.Content(
        role="user",
        parts=[
            types.Part.from_bytes(data=processed_frame, mime_type="image/jpeg"),
            types.Part(text=interpreter_prompt)
        ]
    )

    # 2. Config bypass dictionary
    config = {
        "thinking_config": {
            "thinking_level": "HIGH",
            "include_thoughts": True
        }
    }

    # 3. Call using the 'content' we just defined
    response = client.models.generate_content(
        model="gemini-3-flash-preview", 
        contents=[content], 
        config=config
    )
    
    # 4. Safe signature extraction
    new_signature = session_signature
    try:
        part = response.candidates[0].content.parts[0]
        if hasattr(part, 'thought_signature'):
            new_signature = part.thought_signature
    except (AttributeError, IndexError):
        pass

    # Return the text (the brief) and the signature
    return response.text, new_signature