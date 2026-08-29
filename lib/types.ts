export type RoomStatus = "proposed" | "verified" | "closed" | "rejected";

export type RoomType =
  | "card_room"
  | "casino"
  | "tribal_casino"
  | "social_club"
  | "other"
  | string;

export type Source = {
  url: string;
  title: string | null;
  retrieved_at: string | null;
};

export type Room = {
  id: number;
  slug: string;
  name: string;
  type: RoomType | null;
  address: string | null;
  city: string | null;
  state: string;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  games: string[] | string | null;
  stakes_notes: string | null;
  tournament_notes: string | null;
  notes: string | null;
  status: RoomStatus | string;
  created_at: string;
  updated_at: string;
  sources?: Source[];
};

export type HealthResponse = {
  ok: boolean;
  rooms: number;
  db: string;
};

export type StateCount = {
  state: string;
  rooms: number;
};

export type StatesResponse = {
  count: number;
  states: StateCount[];
};

export type RoomsListResponse = {
  total: number;
  limit: number;
  offset: number;
  rooms: Room[];
};

export type RoomsQuery = {
  state?: string;
  city?: string;
  q?: string;
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
};
