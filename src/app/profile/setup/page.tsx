"use client";

import { useProfile } from "@/hooks/useProfile";

export default function ProfilePage() {
  const { data, loading, error } = useProfile();

  if (loading)
    return (
      <div className="p-10 text-white">Loading profile...</div>
    );

  if (error)
    return (
      <div className="p-10 text-red-400">{error}</div>
    );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-black text-white p-10">

      <div className="mb-10">
        <h1 className="text-3xl font-bold">Explorer Profile</h1>
        <p className="text-gray-400">
          Your journey through the Space Academy
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">

        <div className="flex items-center gap-6">

          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-xl font-bold">
            {data.profile.fullName?.[0] ?? "?"}
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              {data.profile.fullName}
            </h2>
            <p className="text-gray-400">{(data as any)?.phone ?? ""}</p>
          </div>

        </div>

      </div>

      <div className="grid grid-cols-4 gap-6">

        <Stat title="Total XP" value={data.totalXP} />
        <Stat title="Level" value={data.level} />
        <Stat title="Streak" value={`${data.streakCount} days`} />
        <Stat title="Coins" value={data.wallet.coins} />

      </div>

      <div className="mt-10 bg-zinc-900 p-6 rounded-xl border border-zinc-800">

        <h3 className="text-lg font-semibold mb-4">
          XP Progress
        </h3>

        <div className="w-full bg-zinc-800 rounded-full h-4">

          <div
            className="bg-orange-500 h-4 rounded-full"
            style={{ width: `${Math.min((data.totalXP % 1000) / 10, 100)}%` }}
          />

        </div>

        <p className="text-sm text-gray-400 mt-2">
          {data.totalXP % 1000} / 1000 XP to next level
        </p>

      </div>

    </div>
  );
}

function Stat({ title, value }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">

      <p className="text-gray-400 text-sm">{title}</p>

      <p className="text-2xl font-bold text-orange-500">
        {value}
      </p>

    </div>
  );
}