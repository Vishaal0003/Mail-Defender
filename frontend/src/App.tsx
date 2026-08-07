import { Toaster } from "sonner";
import Index from "./pages/Index.tsx";

const App = () => (
  <>
    <Toaster position="top-right" richColors theme="system" />
    <Index />
  </>
);

export default App;
