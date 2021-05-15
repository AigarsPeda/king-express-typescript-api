export type ITeam = {
  name: string;
  team_number: number;
  points: number;
  is_winner: boolean;
  big_points: number;
  tournament_id: number;
  player_id: number;
};

// big_points: 0;
// in_tournament_id: 0;
// is_winner: false;
// name: "elīna";
// player_id: 15;
// points: 0;
// tournament_id: 4;

export type ITeamDB = {
  team_id: number;
  game_number: number;
  player_1: string;
  player_2: string;
  team: number;
  score: number;
  winner: boolean;
  tournament_id: number;
};
