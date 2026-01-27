import os
from flask import Flask, render_template

base_dir = os.path.dirname(os.path.abspath(__file__))
template_dir = os.path.join(base_dir, 'templates')
static_dir = os.path.join(base_dir, 'static')

app = Flask(__name__, 
            template_folder=template_dir, 
            static_folder=static_dir)

app.config['SECRET_KEY'] = 'socratic_secret_2026'

@app.route('/')
def home():
    return render_template('index.html') 

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

@app.route('/dashboard')
def dashboard_view():
    return render_template('dashboard.html')

if __name__ == '__main__':
    print(f"🚀 Socratic Eye Frontend: http://localhost:5001")
    app.run(debug=True, port=5001)