import { H1, P } from "@/components/ui/Typography";
import prisma from "@/lib/prisma";
import {DefaultArgs, GetFindResult, PrismaClientOptions} from "@prisma/client/runtime/client";
import {$UserPayload} from "@/app/generated/prisma/models/User";

export default async function ProfilePage() {
  let users: GetFindResult<$UserPayload<DefaultArgs>, { orderBy: { createdAt: string } }, {
    omit: PrismaClientOptions["omit"]
  }>[] = [];
  let error = null;
  try {
    users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (e) {
    console.error("Error fetching users:", e);
    error =
        "Failed to load users. Make sure your DATABASE_URL is configured.";
  }
  return (
      <main className="p-8">
        <H1 className="text-2xl font-bold mb-4">Users from Database</H1>
        {error ? (
            <P className="text-red-500">{error}</P>
        ) : users.length === 0 ? (
            <P>No users yet. Create one using the API at /api/users</P>
        ) : (
            <ul className="space-y-2">
              {users.map((user) => (
                  <li key={user.id} className="border p-4 rounded">
                    <p className="font-semibold">
                      {user.password}
                    </p>
                    <p className="font-semibold">
                      {user.role}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.email}
                    </p>
                  </li>
              ))}
            </ul>
        )}
      </main>
  );
}

