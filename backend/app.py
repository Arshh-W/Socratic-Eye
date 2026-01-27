#we'll set up API Routes first.
#Let's import the required libraries first
import os 
import base64
import time
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from pydantic import BaseModel, Field
from google import genai 
from google.genai import types
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
#importing our custom made functions  (currently inpr kaam chl rha h)
from database_models import db, User, Session, SessionLog
from vision_preprocessing import preprocess_frame
from reports import report_generation
from db_manager import add_log_entry
from interpreter import get_interpreter_brief

load_dotenv()
#Set up and Flask Configuration
app=Flask(__name__)#Flask object
CORS(app)#Cors to allow communication between different ports.
app.config['SECRET_KEY']='socratic_secret_2026'
socketio= SocketIO(app, cors_allowed_origins= "*") #socketio FLask object


#Gemini Client set up
client= genai.Client(api_key=os.environ.get("GEMINI_API_KEY"),
                    http_options=types.HttpOptions(api_version='v1alpha'))
# Database  configuration abhi final setup nhi h I'll do it tomorrow 
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:qArshRANA@localhost:5432/socratic_eye')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
#creating tables. if they dont exist( first time on local and cloud tabh hoga ye.. will test this tomorrow)
with app.app_context():
    db.create_all()

#Data Models( Ye Pydantic ka kaam h for structured outputs, we'll design classes)
class SocraticResponse(BaseModel):
    vibe:str = Field(description="The emotional tone: encouraging, critical, and also neutral.")
    logic_check:bool = Field(description="True if the code logic is working fine, False if a bug is detected.")
    mentor_message:str= Field(description="Socratic question or hint for the developer.")
    thought_process:str=Field(description="Internal AI reasoning about the logic(Not to be shown to the user keep it hidden from them.)")
    target_lines:list[int]=Field(description="Lines of code being talked about or referenced.")

class SessionStore:
    """ In memory store for thought signatures and history for the database(Redis and Postgresql)"""
    def __init__(self):
        self.thought_signature=None
        self.history=[]#list of dictionaries h ye!!! I keep forgetting this lol
        self.max_history = 10

    def add_to_history(self, mentor_msg):
        self.history.append(mentor_msg)
        # Sliding window for the context window management,keep only the last N messages
        if len(self.history) > self.max_history:
            self.history.pop(0)
    def get_context_string(self):
        """Returns a formatted string of the convo history"""
        if not self.history:
            return "No previous conversation."
        return "\n" + "\n".join([f"- Previous question: {msg}" for msg in self.history])
last_request_time = {}#Will maintain the time, to ensure ki 30 second me ek baar hi request jaye to the gemini api
#REST Routes(Static routes are mainly POST(Request+response Payload) and GET(only Response Payload))
""" We'll keep one Post Route for Session auth and id generation, along with session id, we'll also
 send awarm welcoming message to our user

As for the GET Route, We'll send a report about the entire session to the user so that they know 
what all they learned, and save it in the database whenever the user hits end session."""
sessions={} #temporary storage baadme isse database se connect krdenge
@app.route('/auth/signup',methods=['POST'])
def sign_up():
    username=request.json.get('username')
    password=request.json.get('password')
    if User.query.filter_by(username=username).first():
        return jsonify({'msg':'User already exists, try another name!'}),400
    new_user= User(username=username,
    password_hash=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'msg':'Username successfully created!!', 'user_id': new_user.id })
    
@app.route('/auth/login',methods=['POST'])
def login():
    user= User.query.filter_by(username=request.json.get('username')).first()
    if user and check_password_hash(user.password_hash, request.json.get('password')):
        return jsonify({
            'msg':'Succesfully logged in! Have fun learning',
            'user_Id':user.id,
            'username':user.username
        })
    else: 
        return jsonify({
            'msg':"Invalid Credentials, Kindly try again or singup if you're new"
        }),400

@app.route('/auth/session',methods=['POST'])
def start_session():
    """It will start our AI, uska function mai baadme daaldunga, basic structure is gonna be this, and probably 
    we'll also add login/singups so wo bhi handle krlenge isme hi"""
    user_id= request.json.get('user_id')
    session_id=request.json.get('session_id','asession_id')#handle the session id 

    #user exists or not check
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({
            "msg":"User Not Found!!!"
        }),404
    #save the new session to Postgresql
    new_session= Session(id=session_id,user_id=user_id)
    db.session.add(new_session)
    db.session.commit()
    #Initialize memory store for the real time session track
    sessions[session_id]=SessionStore()

    #Class for handling session history and signature object.
    return jsonify({
        "status":"Online",
        "session_id":session_id,
        "message": f"Welcome Back, {user.username}! Let's learn some cool stuff!"
    })
@app.route('/report',methods=['GET'])
def generate_report():
    """It will generate a session report based of the session memory from the current session
    and then later(I'll connect it to the database for storing the sessions for users to look back at)
    """
    report_string= report_generation(db.session, request.args.get('session_id'))#We'll create this function in another py script, and will import it later
    #later, I'll manage the database connectivty
    return jsonify({
        "report": report_string,
        "message": " We're signing off, Hope to see you soon"
    })

#WEBSOCKET EVENTS 
"""Events will be for the bi-directional streaming and conversation between frontend and backend
One Socket "stream_frame" will handle the information from frontend, call upon preprocessing functions
and call our agents and models to feed on the data and generate structured reponses.
"""
@socketio.on('stream_frame')
def handle_vision(data):
    """handles the coming frames an# System Instruction for Gemini 3 Config 
       information from the frontend, and feeds it to our agents Interpreter and Mentor """
    session_id = data.get('session_id')
    if session_id not in sessions:
        return emit('error', {'msg': 'Session not found!'})
    current_time = time.time()
    if session_id in last_request_time:
        temp = current_time - last_request_time[session_id]
        if temp < 30:
            print(f"⏳ Throttling session {session_id}. Please wait {30 - int(temp)}s.")
            return # ignoring the request without any emits, to save us any extra api calls
    last_request_time[session_id] = current_time
    session = sessions[session_id]
    settings = data.get('settings', {})
    try: 
        # 1. Preprocess(get's the frame preprocessed)
        raw_b64 = data.get('image').split(",")[1]
        processed_bytes = preprocess_frame(raw_b64)
        if not processed_bytes:
            print("Preprocessing failed")
            return emit('error', {'msg': 'Vision processing failed'})
        # 2. INTERPRETER PASS(Gives the code review, brief)
        brief, session.thought_signature = get_interpreter_brief(client, processed_bytes, session.thought_signature)

        # 3. Mentor
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
        #Gemini 3 configuration with Thinking Levels and Structures Outputs
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
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=[content], 
            config=config
        )
        try:
            latest_part = response.candidates[0].content.parts[0]
            if hasattr(latest_part, 'thought_signature') and latest_part.thought_signature:
                raw_sig = latest_part.thought_signature
                session.thought_signature = base64.b64encode(raw_sig).decode('utf-8')
            else:
                print("DEBUG: No new signature returned.")
        except (AttributeError, IndexError):
            pass
        feedback = response.parsed
        #session history me add. 
        session.add_to_history(feedback.mentor_message)
        #send it to database
        add_log_entry(session_id=session_id, message=feedback.mentor_message, signature=session.thought_signature)
        #Send feedback to the frontend 
        print(feedback.model_dump())
        try:
            emit('mentor_feedback', feedback.model_dump())
        except Exception as socket_err:
            print(f"Failed to emit to socket: {socket_err}")

    except Exception as e:
        error_str = str(e)
        if "503" in error_str:
            print(" Gemini is overloaded. Sending fallback...")
            emit('mentor_feedback', {
                "vibe": "neutral",
                "logic_check": True,
                "mentor_message": "I'm thinking deeply about your code logic... give me just a moment to process the details.",
                "thought_process": "API Overloaded (503)",
                "target_lines": []
            })
        else:
            print(f"Error: {e}")
            emit('error', {'msg': "AI Reasoning unavailable"})
        

if __name__ == '__main__':
    socketio.run(app,debug=True, port=5000)

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