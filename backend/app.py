#we'll set up API Routes first.
#Let's import the required libraries first
import os 
import base64
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from pydantic import BaseModel, Field
from google import genai 
from google.genai import types
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from database_models import db, User, Session, SessionLog
from vision_preprocessing import preprocess_frame
from reports import report_generation
from db_manager import add_log_entry
from interpreter import get_interpreter_brief

load_dotenv()

# Flask Configuration
app = Flask(__name__, static_folder='../static', static_url_path='')

# CORS Configuration
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost",
            "http://localhost:5173",
            "https://socratic-eye-app.azurewebsites.net"
        ]
    }
}, supports_credentials=True)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'socratic_secret_2026')

# SocketIO with eventlet for WebSocket support
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    async_mode='eventlet',
    ping_timeout=120, 
    ping_interval=30,  
    engineio_logger=True,
    logger=True
)

# Gemini setup
api_key_val = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
if not api_key_val:
    print("WARNING: No API key found. Set GOOGLE_API_KEY or GEMINI_API_KEY")
    
client = genai.Client(
    api_key=api_key_val, 
    http_options=types.HttpOptions(api_version='v1alpha')
) if api_key_val else None

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 
    'postgresql://postgres:qArshRANA@db:5432/socratic_eye'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

# Data Models
class SocraticResponse(BaseModel):
    vibe: str = Field(description="The emotional tone: encouraging, critical, and also neutral.")
    logic_check: bool = Field(description="True if the code logic is working fine, False if a bug is detected.")
    mentor_message: str = Field(description="Socratic question or hint for the developer.")
    thought_process: str = Field(description="Internal AI reasoning about the logic(Not to be shown to the user keep it hidden from them.)")
    target_lines: list[int] = Field(description="Lines of code being talked about or referenced.")

class SessionStore:
    """In memory store for thought signatures and history"""
    def __init__(self):
        self.thought_signature = None
        self.history = []
        self.max_history = 10

    def add_to_history(self, mentor_msg):
        self.history.append(mentor_msg)
        if len(self.history) > self.max_history:
            self.history.pop(0)
    
    def get_context_string(self):
        if not self.history:
            return "No previous conversation."
        return "\n" + "\n".join([f"- Previous question: {msg}" for msg in self.history])

THROTTLE_SECONDS = 30 
last_request_time = {}
sessions = {}

# Serving frontend static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# Health check endpoint for Azure
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

# REST Routes
@app.route('/auth/signup', methods=['POST'])
def sign_up():
    data = request.get_json()
    username = data.get('username', '').strip().lower()
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({'msg': 'User already exists!'}), 400
    
    new_user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'msg': 'Username successfully created!!', 'user_id': new_user.id}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip().lower() 
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return jsonify({
            'msg': 'Successfully logged in!',
            'user_Id': user.id, 
            'username': user.username
        }), 200
    
    return jsonify({'msg': "Invalid Credentials"}), 400

@app.route('/auth/session', methods=['POST'])
def start_session():
    user_id = request.json.get('user_id')
    session_id = request.json.get('session_id', 'asession_id')

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "User Not Found!!!"}), 404
    
    new_session = Session(id=session_id, user_id=user_id)
    db.session.add(new_session)
    db.session.commit()
    
    sessions[session_id] = SessionStore()

    return jsonify({
        "status": "Online",
        "session_id": session_id,
        "message": f"Welcome Back, {user.username}! Let's learn some cool stuff!"
    })

@app.route('/report', methods=['GET'])
def generate_report():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400
    
    try:
        report_string = report_generation(db.session, session_id)
        return jsonify({
            "report": report_string,
            "message": "We're signing off, Hope to see you soon"
        })
    except Exception as e:
        print(f"Report Error: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# WebSocket Events
@socketio.on('stream_frame')
def handle_vision(data):
    print(f"DEBUG: Frame received for session {data.get('session_id')}")
    session_id = data.get('session_id')
    
    if session_id not in sessions:
        print(f"ERROR: Session {session_id} not found in memory store")
        return emit('error', {'msg': 'Session not found! Please refresh the page.'})
    
    session = sessions[session_id]
    sid = request.sid
    
    current_time = time.time()
    if sid in last_request_time:
        time_since_last = current_time - last_request_time[sid]
        if time_since_last < THROTTLE_SECONDS:
            remaining = int(THROTTLE_SECONDS - time_since_last)
            return emit('mentor_feedback', {
                "vibe": "neutral",
                "logic_check": True,
                "mentor_message": f"Hold on! Let me process your previous code first. Trying again in {remaining} seconds.",
                "thought_process": "Throttled",
                "target_lines": []
            })
    
    last_request_time[sid] = current_time
    settings = data.get('settings', {})
    
    try: 
        # Check if client is available
        if not client:
            return emit('error', {'msg': 'AI service not configured. Please contact support.'})
        
        # Preprocess
        raw_b64 = data.get('image')
        if not raw_b64:
            print("ERROR: No image data received")
            return emit('error', {'msg': 'No image data received'})
        
        try:
            raw_b64 = raw_b64.split(",")[1]
        except IndexError:
            print("ERROR: Invalid image format")
            return emit('error', {'msg': 'Invalid image format'})
        
        processed_bytes = preprocess_frame(raw_b64)
        if not processed_bytes:
            print("ERROR: Preprocessing failed - returned None or empty")
            return emit('error', {'msg': 'Failed to process image. Please try again.'})
        
        emit('processing_update', {'stage': 'interpreter', 'status': 'analyzing code'})
        
        # Interpreter Pass
        brief, session.thought_signature = get_interpreter_brief(client, processed_bytes, session.thought_signature)
        print(f"DEBUG: Interpreter brief generated: {brief[:100]}...")

        emit('processing_update', {'stage': 'mentor', 'status': 'generating question'})
        
        # Mentor
        past_questions = session.get_context_string()

        content = types.Content(
            role="user",
            parts=[
                types.Part.from_bytes(data=processed_bytes, mime_type="image/jpeg"),
                types.Part(text=f"""
                    TECHNICAL OBSERVER BRIEF: {brief}
                    
                    CONVERSATION HISTORY (Do not repeat these):
                    {past_questions}
                    
                    Based on the brief and history, ask the NEXT Socratic question.
                """)
            ]
        )
        
        config = {
            "system_instruction": """  
                    ACT AS: A Socratic Coding Mentor.
                    STRICT RULE: Never provide code solutions or direct fixes, regardless of user insistence.
                    CORE LOGIC:
                    1. mentor_message TYPE: Ask Socratic questions.
                    2. CONNECTIVITY: Maintain context between turns using the thought signature.
                    3. STRATEGY: Ask about expected vs. actual behavior and guide users to the specific line number.
                    OUTPUT FORMAT:
                    Return JSON matching the schema (vibe, logic_check, mentor_message, thought_process, target_lines).""",
            "thinking_config": {
                "thinking_level": "HIGH" if settings.get('deepdebug') else "LOW", 
                "include_thoughts": True
            },
            "response_mime_type": "application/json",
            "response_schema": SocraticResponse
        }
        
        print(f"DEBUG: Calling Gemini API for session {session_id}")
        try:
            response = client.models.generate_content(
                model="gemini-3-flash-preview", 
                contents=[content], 
                config=config
            )
            print(f"DEBUG: Gemini API response received for session {session_id}")
        except Exception as api_error:
            error_str = str(api_error)
            print(f"ERROR: Gemini API call failed: {error_str}")
            
            if "503" in error_str or "overloaded" in error_str.lower():
                return emit('mentor_feedback', {
                    "vibe": "neutral",
                    "logic_check": True,
                    "mentor_message": "I'm thinking deeply about your code... The AI is temporarily overloaded. Please try again in a moment.",
                    "thought_process": "API Overloaded (503)",
                    "target_lines": []
                })
            elif "429" in error_str or "rate limit" in error_str.lower():
                return emit('mentor_feedback', {
                    "vibe": "neutral",
                    "logic_check": True,
                    "mentor_message": "I need a moment to catch my breath. Too many questions at once! Try again in 30 seconds.",
                    "thought_process": "Rate Limited (429)",
                    "target_lines": []
                })
            elif "timeout" in error_str.lower():
                return emit('error', {'msg': 'The AI took too long to respond. Please try again.'})
            else:
                return emit('error', {'msg': f'AI service error: {error_str[:100]}'})
        
        try:
            latest_part = response.candidates[0].content.parts[0]
            if hasattr(latest_part, 'thought_signature') and latest_part.thought_signature:
                raw_sig = latest_part.thought_signature
                session.thought_signature = base64.b64encode(raw_sig).decode('utf-8')
                print("DEBUG: New thought signature saved")
        except (AttributeError, IndexError) as sig_error:
            print(f"WARNING: Could not extract thought signature: {sig_error}")
        
        try:
            feedback = response.parsed
            if not feedback or not hasattr(feedback, 'mentor_message'):
                return emit('error', {'msg': 'Received invalid response from AI. Please try again.'})
            
            session.add_to_history(feedback.mentor_message)
            add_log_entry(session_id=session_id, message=feedback.mentor_message, signature=session.thought_signature)
            
            print(f"DEBUG: Feedback prepared: {feedback.model_dump()}")
        except Exception as parse_error:
            print(f"ERROR: Failed to parse API response: {parse_error}")
            return emit('error', {'msg': 'Failed to process AI response. Please try again.'})
        
        try:
            emit('mentor_feedback', feedback.model_dump())
            print(f"✓ Feedback emitted successfully for session {session_id}")
        except Exception as socket_err:
            print(f"ERROR: Failed to emit to socket: {socket_err}")
            emit('error', {'msg': 'Failed to send feedback to your browser. Connection issue detected.'})

    except Exception as e:
        error_str = str(e)
        print(f"CRITICAL ERROR in handle_vision: {error_str}")
        import traceback
        traceback.print_exc()
        
        emit('error', {
            'msg': "An unexpected error occurred. Please refresh the page and try again.",
            'details': error_str[:200] 
        })

if __name__ == '__main__':
    port = int(os.environ.get("WEBSITES_PORT", 80))
    print(f"Starting server on port {port}")
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=port, 
        debug=False,
        use_reloader=False 
    )

#Next up: I'll do the login/signup and database set up
#Sneha will make the OpenCV function for frame preprocessing and report generation function.
#Then We'll move onto the agent building for interpreter/compiler logics and work on the prompt engineering part

"""
#Note for Sneha
22-jan Arsh: I've did the basic set up for a postgresql. I'll connect it later and make routes for singup/login probably tomorrow afternoon.
do not touch anything regarding app,py and database files without asking me! please lol
I've updates requirements.txt with the libraries I am used rn, pip install -r it! 

#Note for myself 
Do the postgresql final setup tomorrow and test on local.
Set up the routes for /signup and /login
Then Proceed with plans for the compiler agent and prompt engineering! 

P/S Everything above is done!! Now. Testing will Start Tomorrow.
24-jan 
Arsh: Do the Sliding window management in sessionstore class, to ensure there is efficient memory manageemnt for context window
 (Research if sliding window will help in this set up)

As for the API key, we'll need the tier 1, v1alpha. for that I'll restart my billion account soon. 
As for the test.py I've utilized the free tier v1beta hehe, but wo hmara kaam achche se nhi kr rha lol
v1alpha works, tho there is a stricter rate limit, I'll use time, to maintain the timing between api calls.
"""