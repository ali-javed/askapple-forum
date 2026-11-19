// TypeScript types for the iDiscussion Supabase schema (askapple_* DB prefix).
// Keep in sync with supabase/migrations/0001_askapple_forum_schema.sql.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      askapple_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          reputation: number;
          role: "member" | "moderator" | "admin";
          is_banned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          reputation?: number;
          role?: "member" | "moderator" | "admin";
          is_banned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          reputation?: number;
          role?: "member" | "moderator" | "admin";
          is_banned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      askapple_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          icon: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          icon?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          icon?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      askapple_threads: {
        Row: {
          id: string;
          category_id: string | null;
          author_id: string;
          title: string;
          is_solved: boolean;
          is_locked: boolean;
          is_pinned: boolean;
          view_count: number;
          post_count: number;
          last_activity_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          author_id: string;
          title: string;
          is_solved?: boolean;
          is_locked?: boolean;
          is_pinned?: boolean;
          view_count?: number;
          post_count?: number;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          author_id?: string;
          title?: string;
          is_solved?: boolean;
          is_locked?: boolean;
          is_pinned?: boolean;
          view_count?: number;
          post_count?: number;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      askapple_posts: {
        Row: {
          id: string;
          thread_id: string;
          author_id: string;
          body: string;
          post_number: number;
          is_accepted: boolean;
          is_deleted: boolean;
          upvotes: number;
          downvotes: number;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          author_id: string;
          body: string;
          post_number: number;
          is_accepted?: boolean;
          is_deleted?: boolean;
          upvotes?: number;
          downvotes?: number;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          author_id?: string;
          body?: string;
          post_number?: number;
          is_accepted?: boolean;
          is_deleted?: boolean;
          upvotes?: number;
          downvotes?: number;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      askapple_votes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          value?: number;
          created_at?: string;
        };
      };
      askapple_bookmarks: {
        Row: {
          user_id: string;
          thread_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          thread_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          thread_id?: string;
          created_at?: string;
        };
      };
      askapple_reports: {
        Row: {
          id: string;
          reporter_id: string;
          thread_id: string | null;
          post_id: string | null;
          reason: "spam" | "harassment" | "off_topic" | "misinformation" | "other";
          details: string | null;
          status: "open" | "reviewed" | "dismissed" | "actioned";
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          thread_id?: string | null;
          post_id?: string | null;
          reason: "spam" | "harassment" | "off_topic" | "misinformation" | "other";
          details?: string | null;
          status?: "open" | "reviewed" | "dismissed" | "actioned";
          reviewed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          thread_id?: string | null;
          post_id?: string | null;
          reason?: "spam" | "harassment" | "off_topic" | "misinformation" | "other";
          details?: string | null;
          status?: "open" | "reviewed" | "dismissed" | "actioned";
          reviewed_by?: string | null;
          created_at?: string;
        };
      };
      askapple_site_visits: {
        Row: {
          id: string;
          path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          path?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      askapple_increment_thread_view: {
        Args: { thread: string };
        Returns: undefined;
      };
      askapple_total_visits: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      user_role: "member" | "moderator" | "admin";
      report_reason: "spam" | "harassment" | "off_topic" | "misinformation" | "other";
      report_status: "open" | "reviewed" | "dismissed" | "actioned";
    };
  };
}

// Row convenience types.
export type Profile = Database["public"]["Tables"]["askapple_profiles"]["Row"];
export type Category = Database["public"]["Tables"]["askapple_categories"]["Row"];
export type Thread = Database["public"]["Tables"]["askapple_threads"]["Row"];
export type Post = Database["public"]["Tables"]["askapple_posts"]["Row"];
export type Vote = Database["public"]["Tables"]["askapple_votes"]["Row"];
export type Bookmark = Database["public"]["Tables"]["askapple_bookmarks"]["Row"];
export type Report = Database["public"]["Tables"]["askapple_reports"]["Row"];

// Joined shapes used by the UI.
export type AuthorSummary = Pick<
  Profile,
  "id" | "full_name" | "avatar_url" | "reputation" | "role"
>;

export type ThreadWithRelations = Thread & {
  categories: Pick<Category, "id" | "name" | "slug" | "icon" | "color"> | null;
  profiles: AuthorSummary | null;
};

export type PostWithAuthor = Post & {
  profiles: AuthorSummary | null;
};
