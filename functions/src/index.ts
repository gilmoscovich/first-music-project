import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

admin.initializeApp();

const resendApiKey = defineSecret('RESEND_API_KEY');

export const onFeedbackCreated = onDocumentCreated(
  {
    document: 'tracks/{trackId}/feedback/{feedbackId}',
    secrets: [resendApiKey],
  },
  async (event) => {
    const resend = new Resend(resendApiKey.value());
    const { trackId } = event.params;

    // 1. Get the track to find the title and owner
    const trackSnap = await admin.firestore().doc(`tracks/${trackId}`).get();
    if (!trackSnap.exists) {
      console.error(`Track ${trackId} not found`);
      return;
    }
    const track = trackSnap.data() as { title: string; ownerId: string };

    // 2. Get the owner's email from Firebase Auth
    let ownerEmail: string;
    try {
      const userRecord = await admin.auth().getUser(track.ownerId);
      if (!userRecord.email) {
        console.error(`Owner ${track.ownerId} has no email`);
        return;
      }
      ownerEmail = userRecord.email;
    } catch (err) {
      console.error(`Failed to fetch user ${track.ownerId}:`, err);
      return;
    }

    // 3. Send the email
    const { error } = await resend.emails.send({
      from: 'FeedbackStudio <onboarding@resend.dev>',
      to: ownerEmail,
      subject: `New feedback on "${track.title}"`,
      text: `You got new feedback on your track "${track.title}" on FeedbackStudio.\n\nView it here: https://feedbackstudio-a1cc5.web.app/review/${trackId}`,
    });

    if (error) {
      console.error('Resend error:', error);
    } else {
      console.log(`Email sent to ${ownerEmail} for track "${track.title}"`);
    }
  }
);
