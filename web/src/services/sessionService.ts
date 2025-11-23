import { supabase } from "@/integrations/supabase/client";

const USER_ID_KEY = "platanus_hack_user_id";

/**
 * Gets the current user ID from localStorage
 */
export function getCurrentUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

/**
 * Sets the user ID in localStorage
 */
export function setCurrentUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId);
}

/**
 * Clears the current session completely
 * - Deletes user data from database (UserTopics, Answers)
 * - Signs out from Supabase
 * - Clears localStorage
 */
export async function clearSession(): Promise<void> {
  const userId = getCurrentUserId();

  if (userId) {
    try {
      // Delete user's topics
      await supabase.from("UserTopics").delete().eq("user_id", userId);

      // Delete user's answers
      await supabase.from("Answers").delete().eq("user_id", userId);
    } catch (error) {
      console.error("Error deleting user data:", error);
    }
  }

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Clear localStorage
  localStorage.removeItem(USER_ID_KEY);
}

/**
 * Creates a new anonymous user session
 * Returns the new user ID
 */
export async function createNewSession(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error("Error creating anonymous user:", error);
      return null;
    }

    if (data.user) {
      const userId = data.user.id;
      setCurrentUserId(userId);
      return userId;
    }

    return null;
  } catch (error) {
    console.error("Error in createNewSession:", error);
    return null;
  }
}
