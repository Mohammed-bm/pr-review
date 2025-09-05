import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // clear old error

    try {
      await registerUser(formData); // call backend
      navigate("/login"); // success → go to login
    } catch (err) {
      setError(
        err.response?.data?.msg || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Register</h2>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Register
        </button>
      </form>
    </div>
  );
}
