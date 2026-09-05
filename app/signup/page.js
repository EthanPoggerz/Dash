"use client";

import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: role,
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-1">DASH</h1>
        <p className="text-gray-400 text-sm mb-6">Create your account</p>

        {success ? (
          <p className="text-green-400 text-sm">
            Account created! You can now{" "}
            <a href="/login" className="underline">
              log in
            </a>
            .
          </p>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="student">Student</option>
              <option value="beadle">Beadle</option>
              <option value="teacher">Teacher</option>
            </select>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-lg py-2 text-sm font-medium"
            >
              Sign Up
            </button>
          </form>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <p className="text-gray-400 text-sm mt-6 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}