import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/useAuth";

const Register = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        credentials: "include",
        // FIX 1: Send confirmPassword because Zod schema requires it
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        // FIX 2: Check 'message' or 'errors', not 'error'
        // If it's a validation error, data.errors contains the details
        const errorMessage = data.message || "Registration failed";
        
        if (data.errors) {
            // Optional: Log strict validation errors to console to help debugging
            console.error("Validation Errors:", data.errors);
            // Grab the first validation error to show user
            const firstField = Object.keys(data.errors)[0];
            throw new Error(data.errors[firstField][0]);
        }
        
        throw new Error(errorMessage);
      }

      console.log("Registration success:", data);
      setUser(data.data);
      navigate("/");

    } catch (err: any) {
      console.error(err);
      setFormError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="p-10 bg-[#11224E] rounded-2xl max-w-xl w-full">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-4 text-center">
            Create an Account
          </h2>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm text-center">
              {formError}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1">Username:</label>
            <input
              type="text"
              placeholder="Min 6 characters"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Email:</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Password:</label>
            <input
              type="password"
              placeholder="Min 8 chars, 1 Uppercase, 1 Number, 1 Special"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Confirm Password:</label>
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition rounded p-2 font-semibold mt-2"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;