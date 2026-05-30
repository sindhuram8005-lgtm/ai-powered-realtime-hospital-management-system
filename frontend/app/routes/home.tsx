import { Button } from "@/components/ui/button";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

import { redirect } from "react-router";

export function loader() {
  return redirect("/dashboard");
}

export default function Home() {
  return null;
}
