import os
import time
from app import app, client
from database_models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
from google.genai import types

def call_with_retry(prompt, model_name="gemini-3-flash-preview", retries=3):
    """Handles 503 Overloaded errors with exponential backoff."""
    for i in range(retries):
        try:
            return client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    # Flash models support thinking_config in v1alpha
                    thinking_config=types.ThinkingConfig(thinking_level="LOW")
                )
            )
        except Exception as e:
            err_msg = str(e)
            if "503" in err_msg or "overloaded" in err_msg.lower():
                wait = (i + 1) * 5
                print(f"⚠️ Server overloaded ({model_name}). Retrying in {wait}s...")
                time.sleep(wait)
            elif "404" in err_msg:
                print(f"❌ Model {model_name} not found. Check if '-preview' is required.")
                return None
            else:
                print(f"❌ Unexpected API Error: {e}")
                return None
    return None

def test_logic():
    print("--- 🔬 Starting Socratic Eye Integration Test ---")
    
    with app.app_context():
        # 1. Test Database Connection
        print("\n🐘 Testing PostgreSQL...")
        try:
            # This verifies the connection AND the existence of the User table
            user_count = User.query.count()
            print(f"✅ DB Connected. Current User Count: {user_count}")
        except Exception as e:
            print(f"❌ DB Connection Failed: {e}")
            print("👉 Tip: Run 'sudo systemctl status postgresql' on your Mint terminal.")

        # 2. Test Auth Logic
        print("\n🔐 Testing Auth Logic...")
        test_pass = "socratic_test_2026"
        hashed = generate_password_hash(test_pass)
        if check_password_hash(hashed, test_pass):
            print("✅ Password Hashing and Verification: SUCCESS")
        else:
            print("❌ Password Hashing Logic: FAILED")

    print("\n🤖 Testing Gemini API (gemini-3-flash-preview)...")
    test_prompt = "Confirm system readiness for a Socratic Coding Mentor session."
    
    response = call_with_retry(test_prompt)

    if response and response.text:
        print(f"✅ Gemini API Response: {response.text.strip()}")
    

    print("\n" + "="*40)
    print("🏁 Test Suite Complete.")
    print("="*40)

if __name__ == "__main__":
    test_logic()