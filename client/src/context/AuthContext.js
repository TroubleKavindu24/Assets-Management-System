import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check localStorage token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        // Get user data from localStorage or fetch from API
        const userRole = localStorage.getItem("role");
        const userName = localStorage.getItem("userName");
        setUser({ 
          ...decoded, 
          token, 
          role: userRole,
          user_name: userName 
        });
      } catch (error) {
        console.error("Error parsing token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userName");
      }
    }
    setLoading(false);
  }, []);

  const login = async (user_name, password) => {
    const { data } = await axios.post("http://localhost:5005/api/auth/login", {
      user_name,
      password,
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("userName", data.user.user_name);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser({ ...data.user, token: data.token });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };