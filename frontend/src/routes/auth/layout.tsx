export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div
        className="min-h-screen w-screen place-items-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/wallpaper.png)" }}
      >
        {children}
      </div>
    );
  }