import { OnboardingClient } from "./OnboardingClient";

// Net-new screen from screens/onboarding.html. The full 5-step wizard
// (invite-code redeem → account → brand → products → first event) is mostly
// backend-dependent (auth, workspace, events) and not built yet — this renders
// the presentational shell and wires the *Products* step to the real demo
// catalog. The other steps are shown on the rail and flagged for wiring once
// Supabase auth / the events model land.
export default function OnboardingPage() {
  return <OnboardingClient />;
}
