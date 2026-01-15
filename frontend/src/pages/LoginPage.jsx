import { Container, Login } from "../components";

export function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Container className="max-w-full! bg-transparent! border-none! shadow-none! p-0!">
        <Login />
      </Container>
    </div>
  );
}
