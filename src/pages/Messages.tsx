
import { ChatInterface } from '@/components/messaging/ChatInterface';

export default function MessagesPage() {
  return (
    <div className="container max-w-6xl py-6">
      <h1 className="text-2xl font-bold mb-6">Your Messages</h1>
      <ChatInterface />
    </div>
  );
}
