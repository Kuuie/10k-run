import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "./supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserProfile } from "./supabase/types";

export type AuthedContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

export const getSession = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  return { supabase, session };
};

export const requireSession = async (): Promise<AuthedContext> => {
  const { supabase, session } = await getSession();
  if (!session?.user) {
    redirect("/");
  }
  return { supabase, userId: session!.user.id };
};

export const fetchProfile = async (
  supabase: SupabaseClient<Database>,
  userId: string
) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
};
