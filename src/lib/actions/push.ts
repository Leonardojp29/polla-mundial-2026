'use server';

import { createClient } from '@/lib/supabase/server';

type SubscriptionJson = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscription(sub: SubscriptionJson): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };

  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: sub.endpoint,
    user_id: user.id,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  });
  return { ok: !error };
}

export async function removePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !endpoint) return { ok: false };

  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return { ok: !error };
}
