export default function AuthLayout({ children }: { children: React.ReactNode }) {

  return (

   <div className="grid place-items-center" style={{ backgroundImage: 'url(/images/wallpaper.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
    {children}</div>
  );
}


