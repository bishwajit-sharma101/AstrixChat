import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'; 
const SimpleSignupForm = () => {
      const navigate = useNavigate();
  // Simple state to manage form data (optional, but good practice)
  const [formData, setFormData] = useState({
    name: "",
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
    // 🚨 In a real app, you would send formData to your backend here.

    try {
      let response = await axios.post(
        "http://localhost:5000/api/v1/auth/register", formData,{withCredentials: true}
      );
      console.log("Signup data submitted:", formData);
      alert("Signup form submitted! Check console for data.");
      setFormData({ name: '', email: '', password: '' });
      navigate("/login");

    } catch (error) {
      console.log("sending signup data failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 space-y-6 transition duration-300 hover:shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 tracking-tight">
          Create Your Account
        </h2>
        <p className="text-center text-sm text-gray-500">
          Join our community today!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              placeholder="Minimum 6 characters"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Sign Up
          </button>
        </form>

        <div className="text-center text-sm">
          <a
            href="./login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Already have an account? Sign In
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimpleSignupForm;
