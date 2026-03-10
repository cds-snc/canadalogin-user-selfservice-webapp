/// <reference types="vite/client" />

declare module "*.css";
declare module "*.svg?react" {
  import type { FunctionComponent, SVGProps } from "react";

  const component: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default component;
}
