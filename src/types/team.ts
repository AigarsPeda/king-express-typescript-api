export type ITeam = {
  firstPlayer: string;
  secondPlayer: string;
  team: number;
  score: number;
  winner: boolean;
};

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
