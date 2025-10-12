import { useLocation } from "react-router-dom";

// Eagerly import all colocated layouts under routes/**/layout.tsx
const localLayouts = import.meta.glob("../routes/**/layout.tsx", { eager: true });
// Optional global default layout at src/layouts/default.tsx
const defaultLayouts = import.meta.glob("../layouts/default.tsx", { eager: true });

function getDefaultLayout() {
  const mod = Object.values(defaultLayouts)[0] as any | undefined;
  return mod?.default as ((p: { children: React.ReactNode }) => React.ReactElement) | undefined;
}

type LayoutComponent = (p: { children: React.ReactNode }) => React.ReactElement;

const layoutMap: Record<string, LayoutComponent> = {};
for (const [path, mod] of Object.entries(localLayouts)) {
  // path like "../routes/auth/layout.tsx" -> urlPrefix "/auth"
  const urlPrefix = path
    .replace("../routes", "")
    .replace(/\/layout\.tsx$/, "") || "/";
  const Comp = (mod as any).default as LayoutComponent;
  layoutMap[urlPrefix] = Comp;
}

function pickLayout(pathname: string): LayoutComponent | undefined {
  const candidates = Object.keys(layoutMap).sort((a, b) => b.length - a.length);
  for (const prefix of candidates) {
    const normalized = prefix === "/" ? "/" : `/${prefix.replace(/^\//, "")}`;
    if (
      pathname === normalized ||
      pathname.startsWith(normalized.endsWith("/") ? normalized : normalized + "/")
    ) {
      return layoutMap[prefix];
    }
  }
  return getDefaultLayout();
}

export function LayoutResolver({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const Layout = pickLayout(pathname);
  return Layout ? <Layout>{children}</Layout> : <>{children}</>;
}


