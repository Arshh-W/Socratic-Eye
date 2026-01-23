"""
This is to test database connection, I made gemini to make it as per our app.py lol, as for the Flask App testing we'll do it
once we make sure that database and gemini api are working fine. 
"""
import os
from app import app, client
from database_models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
from google.genai import types

def test_logic():
    print("--- 🔬 Starting Socratic Eye Integration Test ---")
    
    with app.app_context():
        # 1. Test Database Connection
        print("\n🐘 Testing PostgreSQL...")
        try:
            # Attempt to query the User table (checks if tables were created)
            user_count = User.query.count()
            print(f"✅ DB Connected. Current User Count: {user_count}")
        except Exception as e:
            print(f"❌ DB Connection Failed: {e}")

        # 2. Test Auth Logic (Hashing & Verification)
        print("\n🔐 Testing Auth Logic...")
        test_pass = "socratic_test_2026"
        hashed = generate_password_hash(test_pass)
        if check_password_hash(hashed, test_pass):
            print("✅ Password Hashing and Verification: SUCCESS")
        else:
            print("❌ Password Hashing Logic: FAILED")

    # 3. Test Gemini API Call (External from App Context)
    print("\n🤖 Testing Gemini API (gemini-3-pro-preview)...")
    try:
        # A simple prompt to ensure the client and API Key are valid
        response = client.models.generate_content(
            model="gemini-3-pro-preview",
            contents="Confirm system readiness."
        )
        if response.text:
            print(f"✅ Gemini API Response: {response.text.strip()}")
        else:
            print("❌ Gemini API: Received empty response.")
    except Exception as e:
        print(f"❌ Gemini API Failed: {e}")

    print("\n" + "="*40)
    print("🏁 Test Suite Complete.")
    print("="*40)

if __name__ == "__main__":
    test_logic()


"""
Test 1 : 24th jan 2026. 
Db is connected. Local FIrst time setup was a haul. 
and as for the GEMINI API KEY, look for solutions to bypass the limit or restart your google cloud account. 
"""