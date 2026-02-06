import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="home-container">
      {/* Animated circuit board background */}
      <div className="circuit-bg"></div>
      <div className="circuit-nodes" id="circuitNodes">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="circuit-node"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className={scrolled ? "scrolled" : ""}>
        <div className="logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Socratic Eye" />
          </div>
          <span>Socratic Eye</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <button className="btn-login" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="btn-signup" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Socratic Eye: The AI Mentor That{" "}
            <span className="highlight">Watches</span>, But Never Tells
          </h1>
          <p>
            Real-time IDE screen sharing and Socratic questioning to guide your
            coding journey.
          </p>
          <button className="btn-hero" onClick={() => navigate("/signup")}>
            Start Mentorship
          </button>
        </div>

        <div className="hero-visual">
          <div className="eye-container">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>

            <div className="eye-element">
              <div className="iris">
                <div className="pupil">
                  <img src="/logo.png" alt="Eye" className="pupil-logo" />
                </div>
              </div>

              <div className="circuit-line circuit-line-1"></div>
              <div className="circuit-line circuit-line-2"></div>
              <div className="circuit-line circuit-line-3"></div>
              <div className="circuit-line circuit-line-4"></div>
              <div className="circuit-line circuit-line-5"></div>
              <div className="circuit-line circuit-line-6"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <h2>Why Socratic Eye?</h2>
          <p>Empowering developers through intelligent guidance</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3>Real-Time Screen Share</h3>
            <p>
              Advanced vision technology watches your IDE in real-time,
              understanding your code context and development flow.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Socratic Questioning</h3>
            <p>
              Instead of giving answers, we guide you with thought-provoking
              questions that deepen your understanding and problem-solving
              skills.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>Personalized Guidance</h3>
            <p>
              Adaptive learning paths that evolve with your coding style,
              providing tailored insights that match your skill level.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="about">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Your journey to mastery in three simple steps</p>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Share Your Screen</h3>
            <p>
              Connect your IDE and let Socratic Eye observe your coding process
              in real-time.
            </p>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Receive Questions</h3>
            <p>
              Get context-aware Socratic questions that guide you to discover
              solutions yourself.
            </p>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Learn & Grow</h3>
            <p>
              Build deeper understanding and become a more confident developer
              through guided discovery.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Learning?</h2>
          <p>Join developers who are mastering code through guided discovery</p>
          <button className="btn-cta" onClick={() => navigate("/signup")}>
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-icon">
                <img src="/logo.png" alt="Socratic Eye" />
              </div>
              <span>Socratic Eye</span>
            </div>
            <p>The AI Mentor That Watches, But Never Tells</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#about">About</a>
            </div>
            <div className="footer-column">
              <h4>Account</h4>
              <a href="#" onClick={() => navigate("/login")}>
                Login
              </a>
              <a href="#" onClick={() => navigate("/signup")}>
                Sign Up
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Socratic Eye. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;