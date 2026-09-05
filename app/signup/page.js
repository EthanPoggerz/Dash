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

      // Save role info in Firestore
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
    <div style={{ padding: "40px", maxWidth: "400px", margin: "0 auto" }}>
      <h1>DASH Sign Up</h1>
      {success ? (
        <p style={{ color: "lightgreen" }}>Account created! You can now log in.</p>
      ) : (
        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px" }}
          >
            <option value="student">Student</option>
            <option value="beadle">Beadle</option>
            <option value="teacher">Teacher</option>
          </select>
          <button type="submit" style={{ padding: "8px 16px" }}>
            Sign Up
          </button>
        </form>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}