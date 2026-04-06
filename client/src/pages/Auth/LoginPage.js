import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Logo from "../../assets/Logo1.png";

const LoginPage = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await login(userName, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.splitLayout}>
        {/* Left Side - Image */}
        <div style={styles.leftSide}>
          <div style={styles.imageContainer}>
            <img src={Logo} alt="Company Logo" style={styles.mainImage} />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={styles.rightSide}>
          <div style={styles.card}>
            <div style={styles.logoContainer}>
              <img src={Logo} alt="Logo" style={styles.logoSmall} />
            </div>
            
            <h2 style={styles.title}>Welcome Back!</h2>
            <p style={styles.subtitle}>Please login to your account</p>
            
            <form onSubmit={handleLogin}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              
              <button 
                type="submit" 
                style={styles.button}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              
              {error && <p style={styles.error}>{error}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  splitLayout: {
    display: "flex",
    height: "100%",
    width: "100%",
  },
  leftSide: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: "40px",
  },
  imageContainer: {
    textAlign: "center",
    animation: "fadeInLeft 0.6s ease-out",
  },
  mainImage: {
    width: "100%",
    maxWidth: "500px",
    height: "auto",
    objectFit: "contain",
  },
  rightSide: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: "40px",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    boxShadow: "0 20px 35px -10px rgba(0,0,0,0.1)",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "440px",
    transition: "transform 0.3s ease",
    animation: "fadeInRight 0.6s ease-out",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logoSmall: {
    width: "80px",
    height: "auto",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: "10px",
  },
  title: {
    margin: "0 0 10px 0",
    color: "#2c3e50",
    textAlign: "center",
    fontSize: "28px",
    fontWeight: "700",
  },
  subtitle: {
    margin: "0 0 32px 0",
    color: "#7f8c8d",
    textAlign: "center",
    fontSize: "14px",
  },
  inputGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#2c3e50",
    fontWeight: "500",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    boxSizing: "border-box",
    transition: "all 0.3s",
    outline: "none",
    backgroundColor: "white",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#ffa600",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s",
    marginTop: "8px",
  },
  error: {
    marginTop: "16px",
    color: "#e74c3c",
    textAlign: "center",
    fontSize: "14px",
    padding: "10px",
    backgroundColor: "#fee2e2",
    borderRadius: "8px",
  },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  input:focus {
    border-color: #ffa600;
    box-shadow: 0 0 0 3px rgba(255, 166, 0, 0.1);
  }
  
  button:hover:not(:disabled) {
    background-color: #e69500;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 166, 0, 0.3);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  @media (max-width: 968px) {
    .leftSide {
      display: none;
    }
    
    .rightSide {
      flex: 1;
    }
  }
`;
document.head.appendChild(styleSheet);

export default LoginPage;