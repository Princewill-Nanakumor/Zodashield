import { StatusProvider } from "@/context/StatusContext";
import UserLeadsContent from "@/components/leads/UserLeadsTableContent";

export default function UserLeadsPage() {
  return (
    <StatusProvider>
      <UserLeadsContent />
    </StatusProvider>
  );
}
