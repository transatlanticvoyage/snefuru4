import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import GconPiecesTable from "./components/GconPiecesTable";

export default async function Pedazos1Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's gcon_pieces data
  const { data: gconPieces, error } = await supabase
    .from("gcon_pieces")
    .select("*")
    .eq("fk_users_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching gcon_pieces:", error);
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Pieces</h1>
        <p className="text-gray-600">
          Manage your article content for future publishing
        </p>
      </div>

      <GconPiecesTable 
        initialData={gconPieces || []} 
        userId={user.id}
      />
    </div>
  );
}