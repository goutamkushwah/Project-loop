import ClassifyDemo from "@/components/ClassifyDemo";

/**
 * Isko browser me dekhne ke liye visit karo: http://localhost:3000/inbox
 *
 * Yeh page.tsx hi wo jagah hai jaha component "import" hota hai
 * taaki UI pe render ho.
 */
export default function InboxPage() {
  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Feedback Inbox</h1>
      <ClassifyDemo feedbackId="demo-feedback-id-123" />
    </main>
  );
}