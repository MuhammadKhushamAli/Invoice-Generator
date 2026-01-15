import { useSelector } from "react-redux";
import { Container } from "../components";

export function HomePage() {
  const userData = useSelector((state) => state?.auth?.userData);
  console.log(userData);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-12">
      {/* Logo Section */}
      {userData?.invoiceLogo && (
        <div className="mb-8 flex justify-center">
          {/* Added object-contain to ensure logo doesn't stretch weirdly */}
          <img
            src={userData?.invoiceLogo}
            alt="Business Logo"
            className="h-24 w-auto object-contain md:h-32 hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Main Heading Section */}
      <div className="mb-4 text-center max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Welcome To{" "}
          <span className="text-indigo-600">
            {userData?.businessName || "Invoice Generator"}
          </span>
        </h1>
      </div>

      {/* Slogan Section */}
      <div className="text-center max-w-2xl">
        <h3 className="text-lg font-medium text-slate-500 sm:text-xl md:text-2xl">
          {userData?.slogan || "We will make best Invoices for You"}
        </h3>
      </div>
    </Container>
  );
}
