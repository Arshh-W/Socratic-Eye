from database_models import db, SessionLog, Session, User

def add_log_entry(session_id, message, signature):
    """
    I'll use this function to Save a Socratic interaction to hmari postgresql database
    """
    try:
        new_log = SessionLog(
            session_id=session_id,
            mentor_message=message,
            thought_signature=signature
        )
        db.session.add(new_log)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Database Error: {e}")
        db.session.rollback()
        return False

def get_latest_signature(session_id):
    """
    This function Fetches the last known thought_signature to resume a session, ye feature kaafi bardhiya lgega 
    """
    log = SessionLog.query.filter_by(session_id=session_id).order_by(SessionLog.timestamp.desc()).first()
    return log.thought_signature if log else None