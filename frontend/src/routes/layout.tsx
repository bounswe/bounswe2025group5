
export default function mainLayout({ children }: { children: React.ReactNode }) {
    // put a navbar at the top and make children in the center of the screen
    return (
      <div className="flex flex-col min-h-screen">
        <nav className="bg-gray-800 text-white p-4">
          <h1 className="text-lg font-bold">My Website</h1>
        </nav>
        <main className="flex-grow flex items-center justify-center">
          <div className="min-h-screen w-screen place-items-center bg-cover bg-center bg-no-repeat" >
            {children}
          </div>
        </main>
      </div>
    );
  }