import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, "base64").toString("utf8"),
    }),
  });
}

export async function POST(request) {
  try {
    const { text, author, role } = await request.json();

    const app = getAdminApp();
    const db = getFirestore(app);
    const messaging = getMessaging(app);

    const tokensSnapshot = await db.collection("fcmTokens").get();
    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token).filter(Boolean);

    if (tokens.length === 0) {
      return Response.json({ message: "No registered devices" });
    }

    const message = {
      notification: {
        title: "DASH — New Announcement",
        body: `${author} (${role}): ${text}`,
      },
      tokens: tokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    return Response.json({
      message: "Notification sent",
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error("Notify announcement error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}