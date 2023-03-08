import Head from "next/head";
import Image from "next/image";
import { Inter, Outfit } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { MetaTags } from "@/components/meta";
import { clsx } from "clsx";

const outfit = Outfit({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
      <MetaTags
        title="Lend My Skill"
        description="India's First Freelancing Platform"
      />
      <div className={clsx(styles.container, outfit.className)}>
        <div className={clsx(styles.data, "text-center")}>
          <h1 className="text-4xl font-bold">Welcome to Lend My Skill</h1>
        </div>
      </div>
    </>
  );
}
