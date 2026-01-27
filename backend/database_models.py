"""I'll work on the Database setup here, I'm not good with redis yet, 
so I'll handle it with sqlacademy and postgresql for the prototype submission"""
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

db = SQLAlchemy()
#database hehe

class User(db.Model):#user table me mai, id, username, password ka hash, and sessions store krkr rkh rha hun.
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    sessions = db.relationship('Session', backref='user', lazy=True)

class Session(db.Model):#for session table, we're going wiht session id, userid, start time, final_report for that session and log history
    id = db.Column(db.String(100), primary_key=True) 
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    __tablename__ = 'sessions'
    id = db.Column(db.String(100), primary_key=True) 
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    final_report = db.Column(db.Text, nullable=True)
    logs = db.relationship('SessionLog', backref='session', lazy=True)

class SessionLog(db.Model):#as for the session log itself, we'll keep it with id, session_id, timestack(video frame kabh ka tha), mentor ka message regarding it and the thought signature 
    __tablename__ = 'session_logs'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('sessions.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    mentor_message = db.Column(db.Text)
    # Using JSONB for Gemini 3 signatures allows for faster retrieval and complex queries
    thought_signature = db.Column(JSONB)