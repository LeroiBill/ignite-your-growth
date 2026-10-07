import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const myNightsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-nights", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("night_members")
        .select("xp, night:nights(*, night_members(count))")
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
