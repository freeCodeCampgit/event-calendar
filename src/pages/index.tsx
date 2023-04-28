import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import { GetStaticProps } from "next";
import { format } from "date-fns";
import distance from "@turf/distance";
import { point, type Point, type Feature } from "@turf/helpers";

import styles from "@/styles/Home.module.css";
import LoginButton from "@/components/login-btn";
import { prisma } from "@/db";
import { Event } from "@prisma/client";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

type EventInfo = { date: string } & Omit<
  Event,
  "createdAt" | "updatedAt" | "creatorId" | "date"
>;

type EventWithDistance = EventInfo & { distance: number | null };

type EventProps = {
  events: EventInfo[];
};

export const getStaticProps: GetStaticProps<EventProps> = async () => {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      date: true,
      link: true,
      latitude: true,
      longitude: true,
    },
  });
  const serializeableEvents = events.map((event) => ({
    ...event,
    date: event.date.toISOString(),
  }));

  return {
    props: {
      events: serializeableEvents,
    },
    revalidate: 10,
  };
};

function getDistance(userPosition: Feature<Point> | null, event: EventInfo) {
  const eventPosition = point([event.longitude, event.latitude]);
  const distanceToEvent = userPosition
    ? distance(userPosition, eventPosition, {
        units: "kilometers",
      })
    : null;
  return distanceToEvent;
}

function eventInRadius(
  userPosition: Feature<Point> | null,
  event: EventInfo,
  radius: number
) {
  const distanceToEvent = getDistance(userPosition, event);
  return distanceToEvent ? distanceToEvent <= radius : true;
}

function EventCard({ event }: { event: EventWithDistance }) {
  return (
    <ul>
      <li>
        <a href={event.link}>{event.name}</a>
      </li>
      {/* TODO: replace with a spinner (or similar) to gracefully handle
        the delay between receiving the HTML and the browser rendering 
        the date */}
      <li suppressHydrationWarning>
        {format(new Date(event.date), "E LLLL d, yyyy @ HH:mm")}
      </li>
      {event.distance !== null && (
        <li>Distance to event: {event.distance.toFixed(2)} km</li>
      )}
    </ul>
  );
}

export default function Home({ events }: EventProps) {
  const [userPosition, setUserPosition] = useState<Feature<Point> | null>(null);
  useEffect(() => {
    if (!userPosition) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserPosition(
          point([position.coords.longitude, position.coords.latitude])
        );
      });
    }
  }, [userPosition]);

  const eventsInRange = events.filter((event) =>
    eventInRadius(userPosition, event, 100)
  );

  const eventsWithDistance = eventsInRange.map((event) => ({
    ...event,
    distance: getDistance(userPosition, event),
  }));

  return (
    <>
      <LoginButton />
      <h2> {userPosition ? "Nearby" : ""} Events </h2>
      {eventsWithDistance.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.description}>
          <p>
            Get started by editing&nbsp;
            <code className={styles.code}>src/pages/index.tsx</code>
          </p>
          <div>
            <a
              href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              By{" "}
              <Image
                src="/vercel.svg"
                alt="Vercel Logo"
                className={styles.vercelLogo}
                width={100}
                height={24}
                priority
              />
            </a>
          </div>
        </div>

        <div className={styles.center}>
          <Image
            className={styles.logo}
            src="/next.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
        </div>

        <div className={styles.grid}>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className={inter.className}>
              Docs <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              Find in-depth information about Next.js features and&nbsp;API.
            </p>
          </a>

          <a
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className={inter.className}>
              Learn <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              Learn about Next.js in an interactive course with&nbsp;quizzes!
            </p>
          </a>

          <a
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className={inter.className}>
              Templates <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              Discover and deploy boilerplate example Next.js&nbsp;projects.
            </p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className={inter.className}>
              Deploy <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              Instantly deploy your Next.js site to a shareable URL
              with&nbsp;Vercel.
            </p>
          </a>
        </div>
      </main>
    </>
  );
}
