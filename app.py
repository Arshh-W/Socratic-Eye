#we'll set up API Routes first.
#Let's import the required libraries first
import os 
import base64
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from pydantic import BaseModel, Field
from google import genai 
from google.genai import types

#Set up and Flask Configuration
app=Flask(__name__)#Flask object
app.config['SECRET_KEY']='socratic_secret_2026'
socketio= SocketIO(app, cors_allowed_origins= "*") #socketio FLask object

#Gemini Client set up
client= genai.Client(api_key=os.enviorn.get("GEMINI_API_KEY"),
                    http_options=types.HttpOptions(api_version='v1alpha'))

#Data Models( Ye Pydantic ka kaam h for structured outputs, we'll design classes)

#REST Routes(Static routes are mainly POST(Request+response Payload) and GET(only Response Payload))
""" We'll keep one Post Route for Session auth and id generation, along with session id, we'll also
 send awarm welcoming message to our user

As for the GET Route, We'll send a report about the entire session to the user so that they know 
what all they learned, and save it in the database whenever the user hits end session."""
sessions={} #temporary storage baadme isse database se connect krdenge
@app.route('/auth/session',methods=['POST'])
def start_session():
    """It will start our AI, uska function mai baadme daaldunga, basic structure is gonna be this, and probably 
    we'll also add login/singups so wo bhi handle krlenge isme hi"""
    session_id= request.json.get('session_id','anonymous')
    sessions[session_id]= #I'll make a class function which will store the details in the backend later.
    return jsonify({
        "status":"Online",
        "session_id":session_id
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


if __name__ == '__main__':
    socketio.run(app,debug=True, port=5000)