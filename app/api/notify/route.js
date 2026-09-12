import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

function getCurrentDayName() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

function parseStartTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const startPart = timeStr.split("-")[0].trim();
  const match = startPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let [, hours, minutes, meridian] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (meridian.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridian.toUpperCase() === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export async function GET(request) {
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const messaging = getMessaging(app);

    const currentDay = getCurrentDayName();
    const currentMinutes = getCurrentMinutes();

    const scheduleSnapshot = await db.collection("schedule").get();
    const upcomingClasses = [];

    scheduleSnapshot.forEach((doc) => {
      const c = doc.data();
      if (c.day !== currentDay) return;
      const startMinutes = parseStartTimeToMinutes(c.time);
      if (startMinutes === null) return;
      const diff = startMinutes - currentMinutes;
      if (diff > 0 && diff <= 5) {
        upcomingClasses.push({ ...c, id: doc.id, diff });
      }
    });

    if (upcomingClasses.length === 0) {
      return Response.json({ message: "No upcoming classes", checked: currentDay });
    }

    const tokensSnapshot = await db.collection("fcmTokens").get();
    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token).filter(Boolean);

    if (tokens.length === 0) {
      return Response.json({ message: "No registered devices", upcomingClasses });
    }

    const results = [];
    for (const c of upcomingClasses) {
      const message = {
        notification: {
          title: "DASH — Class Starting Soon",
          body: `${c.subject} starts in ${c.diff} minute${c.diff === 1 ? "" : "s"} (${c.time})`,
        },
        tokens: tokens,
      };
      const response = await messaging.sendEachForMulticast(message);
      results.push({ subject: c.subject, successCount: response.successCount, failureCount: response.failureCount });
    }

    return Response.json({ message: "Notifications sent", results });
  } catch (error) {
    console.error("Notify error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}