import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const email = (body?.email || "").toString().trim().toLowerCase();
    const role = (body?.role || "tenant_user").toString();
    const tenantId = (body?.tenantId || "").toString();
    const redirectTo = body?.redirectTo?.toString();

    if (!email || !tenantId) {
      return new Response(JSON.stringify({ error: "Missing email or tenantId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: membershipCheck, error: membershipError } = await supabaseAdmin
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membershipCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAdmin = membershipCheck.role === "tenant_admin" || membershipCheck.role === "superadmin";
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingUser } = await supabaseAdmin
      .schema("auth")
      .from("users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser?.id) {
      const { error: upsertError } = await supabaseAdmin
        .from("memberships")
        .upsert(
          { tenant_id: tenantId, user_id: existingUser.id, role },
          { onConflict: "tenant_id,user_id" }
        );

      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ status: "added_existing" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: { tenant_id: tenantId, role },
      }
    );

    if (inviteError || !inviteData?.user?.id) {
      return new Response(JSON.stringify({ error: inviteError?.message || "Invite failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: inviteMembershipError } = await supabaseAdmin
      .from("memberships")
      .upsert(
        { tenant_id: tenantId, user_id: inviteData.user.id, role },
        { onConflict: "tenant_id,user_id" }
      );

    if (inviteMembershipError) {
      return new Response(JSON.stringify({ error: inviteMembershipError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "invited" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
