import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import SeasonStatsPage from "./pages/SeasonStatsPage";
import GamesPage from "./pages/GamesPage";
import PlayersPage from "./pages/PlayersPage";
import PlayerDetailsPage from "./pages/PlayerDetailsPage";
import LiveGamePage from "./pages/LiveGamePage";
import GameDetailsPage from "./pages/GameDetailsPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />}/>
        <Route path="/season" element={<SeasonStatsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:gameId" element={<GameDetailsPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/players/:playerId" element={<PlayerDetailsPage />} />
      </Route>
    </Routes>
  );
}