from google.genai import types

def get_interpreter_brief(client, processed_frame, session_signature):
    """
    The Interpreter Agent: Extracts code from the vission and give a briefing about bugs and logical errors!
    """
    
    # I'll tell Gemini to be a static analyzer.
    interpreter_prompt = """
    Act as a Static Code Analyzer.
    1. Extract the code from the image provided.
    2. Identify the language (C++, Python, etc.).
    3. Find the EXACT logical flaw (e.g., off-by-one, memory leak, infinite loop).
    4. Output a hidden technical brief for the mentor agent.
    
    RULES: 
    - Do NOT talk to the user. 
    - Be brief and technical.
    - If no code is found, state 'NO_CODE_DETECTED_YET'.
    """

    content = types.Content(
        role="user",
        parts=[
            types.Part.from_bytes(data=processed_frame, mime_type="image/jpeg"),
            types.Part(text=interpreter_prompt)
        ]
    )

    # Using HIGH thinking_level here
    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
            include_thoughts=True
        ),
        # Passing the signature ensures the agent knows what's going on
        thought_signature=session_signature 
    )

    response = client.models.generate_content(
        model="gemini-3-pro-preview",
        contents=[content],
        config=config
    )
    
    # Returning the hidden brief and the updates signature for the mentor agent
    return response.text, response.candidates[0].content.parts[0].thought_signature