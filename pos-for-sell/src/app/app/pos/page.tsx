import { mockProducts } from "./mock-data";
import { POSWorkspace } from "./POSWorkspace";

export default function POSPage() {
  // DD-55+ will replace mockProducts with a real Supabase fetch scoped by
  // workspace_id and the current event.
  return <POSWorkspace products={mockProducts} />;
}
