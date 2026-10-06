import { redirect } from "next/navigation";

// The leaderboard lives on the community page
export default function LeaderboardPage() {
  redirect("/community#leaderboard");
}
