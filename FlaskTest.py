"""
Testing the Signup Route first

curl -X POST http://localhost:5000/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"username": "arsh_test", "password": "securepassword123"}'

Testing the Login Route

curl -X POST http://localhost:5000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "arsh_test", "password": "securepassword123"}'

Testing the Start Session Route

curl -X POST http://localhost:5000/auth/session \
     -H "Content-Type: application/json" \
     -d '{"user_id": 1, "session_id": "test_session_001"}'

Testing the Report Route

curl -X GET http://localhost:5000/report?session_id=test_session_001
"""