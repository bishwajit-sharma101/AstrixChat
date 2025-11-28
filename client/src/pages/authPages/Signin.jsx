import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 

const Signin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response = await axios.post(
        "http://localhost:5000/api/v1/auth/login",
        formData,
        { withCredentials: true }
      );

      console.log("Login success:", response.data);

      setFormData({ email: '', password: '' });

      navigate("/chat");
      console.log("NAVIGATED!");
    } catch (error) {
      console.log("Login failed:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 space-y-6 hover:shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </button>
        </form>

        <div className="text-center text-sm">
          <a href="/" className="text-indigo-600 hover:text-indigo-500">
            Don't have an account? Sign Up
          </a>
        </div>
      </div>
    </div>
  );
};

export default Signin;
