import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { Container, Button } from "@/components/ui";
import Image from "next/image";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";

export const metadata = {
  title: "Profile - CyberCodex.io",
  description: "Your CyberCodex profile",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user data
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      courseProgress: {
        orderBy: {
          updatedAt: "desc",
        },
      },
      badges: {
        include: {
          badge: true,
        },
        orderBy: {
          unlockedAt: "desc",
        },
      },
    },
  });

  if (!userData) {
    redirect("/login");
  }

  // Fetch follower and following counts separately
  const followerCount = await prisma.userFollow.count({
    where: { followingId: session.user.id },
  });

  const followingCount = await prisma.userFollow.count({
    where: { followerId: session.user.id },
  });

  const completedCourses = userData.courseProgress.filter((p) => p.isCompleted).length;
  const totalExercises = userData.courseProgress.reduce(
    (acc, cp) => acc + cp.exercisesCompleted,
    0
  );

  // Prepare stats for ProfileStats component
  const stats = [
    {
      label: "Exercises",
      value: totalExercises,
      color: "cyber-secondary",
    },
    {
      label: "Total XP",
      value: userData.totalXp.toLocaleString(),
      color: "cyber-warning",
    },
    {
      label: "Badges",
      value: userData.badges.length,
      color: "cyber-primary",
    },
    {
      label: "Streak",
      value: `${userData.streak} days`,
      color: "cyber-danger",
    },
  ];

  return (
    <main className="min-h-screen pt-28 pb-24">
      <ProfilePageClient
        userData={userData}
        followerCount={followerCount}
        followingCount={followingCount}
        stats={stats}
      />
    </main>
  );
}
