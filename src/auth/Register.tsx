import React, { useState, type FormEvent } from "react";
import { useAuth } from "../utils/useAuth";

const Register = () => {
  const {setUser} = useAuth();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try{
        const res = await fetch("http://localhost:3000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
            credentials: "include",
            body: JSON.stringify({username, email, password, confirmPassword})
        });
        if(!res.ok){
            const errData = await res.json();
            throw new Error(errData.error || "Registration failed. User already exists");
        }

        const data = await res.json();
        console.log(data)
        setUser(data);
        
    }catch(err){
        console.log(err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="p-10 bg-[#11224E] rounded-2xl max-w-xl">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-4 text-center">
            Create an Account
          </h2>
          <div className="mb-4">
            <label className="block mb-1">Username:</label>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
              value = {username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Email:</label>
            <input
              type="text"
              placeholder="Email"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
              value = {email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Password:</label>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
              value = {password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Confirm Password:</label>
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
              value = {confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition rounded p-2 font-semibold"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
