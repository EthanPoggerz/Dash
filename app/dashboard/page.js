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
  return d.toISOString().split("T")[0];
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

  useEffect(() => {
    if (!userData) return;
    const fetchStudents = async () => {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snapshot = await getDocs(q);
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchStudents();
  }, [userData]);

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Loading...
      </div>
    );

  const canPost = userData.role === "beadle" || userData.role === "teacher";
  const canManageSchedule = userData.role === "beadle" || userData.role === "teacher";
  const canMarkAttendance = userData.role === "beadle" || userData.role === "teacher";

  const roleColors = {
    student: "bg-blue-600",
    beadle: "bg-purple-600",
    teacher: "bg-emerald-600",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">DASH</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${roleColors[userData.role]} capitalize`}>
            {userData.role}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{userData.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-600 hover:bg-red-700 transition px-4 py-2 rounded-lg"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Role summary card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          {userData.role === "student" && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Student Overview</h2>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside mb-4">
                <li>View your class schedule</li>
                <li>See announcements</li>
                <li>Check your attendance record</li>
              </ul>
              <p className="text-sm">
                Today&apos;s attendance:{" "}
                <span className="font-semibold capitalize">
                  {attendanceToday[userData.uid] || "Not marked yet"}
                </span>
              </p>
            </div>
          )}
          {userData.role === "beadle" && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Beadle Overview</h2>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>Mark today&apos;s attendance</li>
                <li>Post an announcement</li>
                <li>View class schedule</li>
              </ul>
            </div>
          )}
          {userData.role === "teacher" && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Teacher Overview</h2>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>View attendance reports</li>
                <li>Manage class schedule</li>
                <li>Post announcements</li>
              </ul>
            </div>
          )}
        </div>

        {/* Attendance */}
        {canMarkAttendance && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Attendance — {today}</h2>
            {students.length === 0 && <p className="text-gray-400 text-sm">No student accounts found yet.</p>}
            <div className="space-y-2">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3"
                >
                  <span className="text-sm">{s.email}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkAttendance(s.id, "present")}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${
                        attendanceToday[s.id] === "present"
                          ? "bg-green-600"
                          : "bg-gray-700 hover:bg-green-700"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(s.id, "absent")}
                      className={`text-xs px-3 py-1.5 rounded-lg transition ${
                        attendanceToday[s.id] === "absent"
                          ? "bg-red-600"
                          : "bg-gray-700 hover:bg-red-700"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Schedule */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Class Schedule</h2>

          {canManageSchedule && (
            <form onSubmit={handleAddClass} className="grid gap-3 sm:grid-cols-3 mb-6">
              <input
                type="text"
                placeholder="Subject (e.g. Math)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="sm:col-span-3 bg-blue-600 hover:bg-blue-700 transition rounded-lg py-2 text-sm font-medium"
              >
                Add Class
              </button>
            </form>
          )}

          <div className="space-y-2">
            {schedule.length === 0 && <p className="text-gray-400 text-sm">No classes scheduled yet.</p>}
            {schedule.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3"
              >
                <span className="text-sm">
                  <strong>{c.subject}</strong> — {c.day} @ {c.time}
                </span>
                {canManageSchedule && (
                  <button
                    onClick={() => handleDeleteClass(c.id)}
                    className="text-xs bg-red-600 hover:bg-red-700 transition px-3 py-1.5 rounded-lg"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Announcements */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Announcements</h2>

          {canPost && (
            <form onSubmit={handlePostAnnouncement} className="mb-6">
              <textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Write an announcement..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-500"
                rows={3}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 transition rounded-lg px-4 py-2 text-sm font-medium"
              >
                Post Announcement
              </button>
            </form>
          )}

          <div className="space-y-3">
            {announcements.length === 0 && <p className="text-gray-400 text-sm">No announcements yet.</p>}
            {announcements.map((a) => (
              <div key={a.id} className="bg-gray-800 rounded-lg px-4 py-3">
                <p className="text-sm">{a.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  — {a.author} ({a.role})
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}