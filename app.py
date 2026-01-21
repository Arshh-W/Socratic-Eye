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


#WEBSOCKET EVENTS 


if __name__ == '__main__':
    socketio.run(app,debug=True, port=5000)