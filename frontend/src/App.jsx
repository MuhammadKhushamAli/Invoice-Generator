import { Container, NavBar } from "./components";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-700">
      <Container className="max-w-full! bg-transparent! p-0! shadow-none! border-none! relative flex flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </Container>
    </div>
  );
}

export default App;
