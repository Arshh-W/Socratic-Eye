#we'll set up API Routes first.
#Let's import the required libraries first
import os 
import base64
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from pydantic import BaseModel, Field
from google import genai 
from google.genai import types
from werkzeug.security import generate_password_hash, check_password_hash

#importing our custom made functions  (currently inpr kaam chl rha h)
from vision_preprocessing import preprocess_frame
from reports.py import report_generation
from db_manager import add_log_entry


#Set up and Flask Configuration
app=Flask(__name__)#Flask object
app.config['SECRET_KEY']='socratic_secret_2026'
socketio= SocketIO(app, cors_allowed_origins= "*") #socketio FLask object

#Gemini Client set up
client= genai.Client(api_key=os.environ.get("GEMINI_API_KEY"),
                    http_options=types.HttpOptions(api_version='v1alpha'))



# Database  configuration abhi final setup nhi h I'll do it tomorrow 
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', '')
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
        self.history=[]

#REST Routes(Static routes are mainly POST(Request+response Payload) and GET(only Response Payload))
""" We'll keep one Post Route for Session auth and id generation, along with session id, we'll also
 send awarm welcoming message to our user

As for the GET Route, We'll send a report about the entire session to the user so that they know 
what all they learned, and save it in the database whenever the user hits end session."""
sessions={} #temporary storage baadme isse database se connect krdenge
@app.route('/auth/singup',methods=['POST'])
def sign_up():
    username=request.json.get('username')
    password=request.json.get('password')
    if User.query.filter_by(username=username).first():
        return jsonify({'msg':'User already exists, try another name!'}),400
    new_user= User(username=username,
    password_hash=generate_password_hash(password))
    db.session.add(new_user)
    db.commit()
    return jsonify({'msg':'Username successfully created!!', 'user_id': new_user.id })
    
@app.route('auth/login',methods['POST'])
def login():
    user=request.json.get('username')
    if user and check_password_hash(request.json.get('password')):
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
    user=User.query.get(user_id)
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
    report_string= report_generation()#We'll create this function in another py script, and will import it later
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
    """handles the coming frames and information from the frontend, and feeds it to our models and agents"""
    session_id=data.get('session_id')
    frame_b64=data.get('image').split(",")[1]
    frame_b64= preprocess_frame(frame_b64)
    settings= data.get('settings',{})

    if session_id not in sessions:
        return emit('error','Session not found, Please start a new session!')
    session=sessions[session_id]
    try: 
        #Prepare the Multimodal Prompt
        content = types.Content(
            role="user",
            parts=[
                types.Part.from_bytes(
                    data=base64.b64decode(frame_b64),
                    mime_type="image/jpeg"
                ),
                types.Part(text="Analyze my current coding progress and logic.")
            ]
        )
        #Gemini 3 configuration with Thinking Levels and Structures Outputs
        config= types.GenerateContentConfig(
            system_instruction=""" Prompt Template here(baadme daaldenge)
            """,
            thinking_config=types.ThinkingConfig(thinking_level="HIGH" if settings.get('deepdebug') 
            else "LOW", include_thoughts=True),
            response_mime_type="application/json",
            response_schema=SocraticResponse #our Pydantic class for response structure
        )
        #Let's Call Gemini 3 with Thought Signature and our configurations
        response= client.models.generate_content(
            model="gemini-3-pro-preview",
            contents=[content],
            config=config
        )
        session.thought_signature = response.candidates[0].content.parts[0].thought_signature
        #send it to database 
        add_log_entry(
            session_id=session_id, 
            message=feedback.mentor_message, 
            signature=session.thought_signature
            )           
        #Send feedback to the frontend 
        feedback=response.parsed
        emit('mentor_feedback',feedback.model_dump())
    except Exception as e:
        print(f"Error processing the frame: {e}")
        emit('error',{'msg':"AI Reasoning isn't available rn"})
        

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
"""