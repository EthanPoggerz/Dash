"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

function getTodayString() {
  const d = new Date();
  return d.toISOString().split("T")[0]; // e.g. "2026-09-05"
}

export default function DashboardPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [subject, setSubject] = useState("");
  const [day, setDay] = useState("Monday");
  const [time, setTime] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState({});
  const router = useRouter();
  const today = getTodayString();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData({ email: user.email, uid: user.uid, ...docSnap.data() });
        }
        setLoading(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "schedule"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSchedule(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Fetch all students (once userData is loaded)
  useEffect(() => {
    if (!userData) return;
    const fetchStudents = async () => {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snapshot = await getDocs(q);
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchStudents();
  }, [userData]);

  // Listen to today's attendance records
  useEffect(() => {
    const q = query(collection(db, "attendance"), where("date", "==", today));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        records[data.studentId] = data.status;
      });
      setAttendanceToday(records);
    });
    return () => unsubscribe();
  }, [today]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    await addDoc(collection(db, "announcements"), {
      text: newAnnouncement,
      author: userData.email,
      role: userData.role,
      createdAt: serverTimestamp(),
    });
    setNewAnnouncement("");
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !time.trim()) return;
    await addDoc(collection(db, "schedule"), {
      subject,
      day,
      time,
      addedBy: userData.email,
      createdAt: serverTimestamp(),
    });
    setSubject("");
    setTime("");
  };

  const handleDeleteClass = async (id) => {
    await deleteDoc(doc(db, "schedule", id));
  };

  const handleMarkAttendance = async (studentId, status) => {
    const recordId = `${today}_${studentId}`;
    await setDoc(doc(db, "attendance", recordId), {
      studentId,
      date: today,
      status,
      markedBy: userData.email,
      updatedAt: serverTimestamp(),
    });
  };

  if (loading) return <p style={{ padding: "40px" }}>Loading...</p>;

  const canPost = userData.role === "beadle" || userData.role === "teacher";
  const canManageSchedule = userData.role === "beadle" || userData.role === "teacher";
  const canMarkAttendance = userData.role === "beadle" || userData.role === "teacher";

  return (
    <div style={{ padding: "40px" }}>
      <h1>Welcome to DASH</h1>
      <p>Email: {userData.email}</p>
      <p>Role: {userData.role}</p>

      <hr style={{ margin: "20px 0" }} />

      {userData.role === "student" && (
        <div>
          <h2>Student Dashboard</h2>
          <ul>
            <li>View your class schedule</li>
            <li>See announcements</li>
            <li>Check your attendance record</li>
          </ul>
          <p>
            Your attendance today:{" "}
            <strong>{attendanceToday[userData.uid] || "Not marked yet"}</strong>
          </p>
        </div>
      )}

      {userData.role === "beadle" && (
        <div>
          <h2>Beadle Dashboard</h2>
          <ul>
            <li>Mark today's attendance</li>
            <li>Post an announcement</li>
            <li>View class schedule</li>
          </ul>
        </div>
      )}

      {userData.role === "teacher" && (
        <div>
          <h2>Teacher Dashboard</h2>
          <ul>
            <li>View attendance reports</li>
            <li>Manage class schedule</li>
            <li>Post announcements</li>
          </ul>
        </div>
      )}

      <hr style={{ margin: "20px 0" }} />

      {canMarkAttendance && (
        <>
          <h2>Attendance — {today}</h2>
          {students.length === 0 && <p>No student accounts found yet.</p>}
          <div style={{ marginBottom: "30px" }}>
            {students.map((s) => (
              <div
                key={s.id}
                style={{
                  border: "1px solid #444",
                  padding: "10px",
                  marginBottom: "10px",
                  maxWidth: "500px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{s.email}</span>
                <span>
                  <button
                    onClick={() => handleMarkAttendance(s.id, "present")}
                    style={{
                      marginRight: "5px",
                      padding: "5px 10px",
                      backgroundColor: attendanceToday[s.id] === "present" ? "green" : "",
                    }}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(s.id, "absent")}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: attendanceToday[s.id] === "absent" ? "red" : "",
                    }}
                  >
                    Absent
                  </button>
                </span>
              </div>
            ))}
          </div>
          <hr style={{ margin: "20px 0" }} />
        </>
      )}

      <h2>Class Schedule</h2>

      {canManageSchedule && (
        <form onSubmit={handleAddClass} style={{ marginBottom: "20px", maxWidth: "500px" }}>
          <input
            type="text"
            placeholder="Subject (e.g. Math)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
          />
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
          >
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
          </select>
          <input
            type="text"
            placeholder="Time (e.g. 9:00 AM - 10:00 AM)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
          />
          <button type="submit" style={{ padding: "8px 16px" }}>
            Add Class
          </button>
        </form>
      )}

      <div style={{ marginBottom: "30px" }}>
        {schedule.length === 0 && <p>No classes scheduled yet.</p>}
        {schedule.map((c) => (
          <div key={c.id} style={{ border: "1px solid #444", padding: "10px", marginBottom: "10px", maxWidth: "500px", display: "flex", justifyContent: "space-between" }}>
            <span>
              <strong>{c.subject}</strong> — {c.day} @ {c.time}
            </span>
            {canManageSchedule && (
              <button onClick={() => handleDeleteClass(c.id)} style={{ marginLeft: "10px" }}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h2>Announcements</h2>

      {canPost && (
        <form onSubmit={handlePostAnnouncement} style={{ marginBottom: "20px" }}>
          <textarea
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="Write an announcement..."
            style={{ display: "block", width: "100%", maxWidth: "500px", padding: "8px", marginBottom: "10px" }}
          />
          <button type="submit" style={{ padding: "8px 16px" }}>
            Post Announcement
          </button>
        </form>
      )}

      <div>
        {announcements.length === 0 && <p>No announcements yet.</p>}
        {announcements.map((a) => (
          <div key={a.id} style={{ border: "1px solid #444", padding: "10px", marginBottom: "10px", maxWidth: "500px" }}>
            <p>{a.text}</p>
            <small>— {a.author} ({a.role})</small>
          </div>
        ))}
      </div>

      <button onClick={handleLogout} style={{ padding: "8px 16px", marginTop: "20px" }}>
        Log Out
      </button>
    </div>
  );
}