import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/useAuth";
import { authService } from "../services/auth.service";
import { LoadingButton } from "../components/LoadingButton";

const Register = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const userData = await authService.register({
        username,
        email,
        password,
        confirmPassword,
      });

      setUser(userData);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Registration failed");
    } finally {
      setLoading(false);
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
          <LoadingButton type="submit" loading={loading}>
            Register
          </LoadingButton>
        </form>
      </div>
    </div>
  );
};

export default Register;
