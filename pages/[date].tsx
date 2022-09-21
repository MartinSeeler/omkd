import type { GetStaticPaths, InferGetStaticPropsType } from "next";
import { trpc } from "../utils/trpc";
// @ts-ignore
import cosSimilarity from "cos-similarity";
import { MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/20/solid";
import { Formik, Field, Form } from "formik";
import { useEffect, useState } from "react";
import { RoughNotation } from "react-rough-notation";
import { prisma } from "../db/client";

import { GetStaticProps } from "next";
import { ParsedUrlQuery } from "querystring";
import { Location, Price } from "@prisma/client";
import { JSONValue } from "superjson/dist/types";
import Navigation from "../components/navigation";
import { getWeekDates } from "../utils/dates";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: getWeekDates()
      .map((weekday) => ({
        params: { date: weekday },
      }))
      .concat([{ params: { date: "today" } }]),
    // We'll pre-render only these paths at build time.
    // { fallback: blocking } will server-render pages
    // on-demand if the path doesn't exist.
    fallback: "blocking",
  };
};

type Props = {
  date: string;
  locations: (Location & {
    meals: {
      location: Location;
      price: Price[];
      tags: JSONValue;
      name: string;
      id: number;
      embeddings: JSONValue;
    }[];
  })[];
};

interface Params extends ParsedUrlQuery {
  date: string;
}

// `getStaticPaths` requires using `getStaticProps`
export const getStaticProps: GetStaticProps<Props, Params> = async ({
  params,
}) => {
  const { date } = params!;
  const startDate =
    date === "today"
      ? new Date(new Date().toISOString().split("T")[0])
      : new Date(date);
  if (isNaN(startDate.getTime())) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  const locations = await prisma.location.findMany({
    where: {
      meals: {
        some: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      },
    },
    include: {
      meals: {
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        select: {
          date: false,
          location: true,
          price: true,
          tags: true,
          name: true,
          id: true,
          embeddings: true,
        },
      },
    },
  });
  return {
    props: {
      // will be passed to the page component as props
      locations,
      date: startDate.toISOString().split("T")[0],
    },
    // Passed to the page component as props
    revalidate: 3600,
  };
};

const Home = ({
  locations,
  date,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [query, setQuery] = useState("");
  const [top3, setTop3] = useState([] as number[]);
  const queryEmb = trpc.useQuery(["similar", { query }], {
    enabled: query.length >= 3,
    retry(failureCount, error) {
      if (error.data?.httpStatus === 403) return false;
      return failureCount < 3;
    },
  });

  // get current date in YYYY-MM-DD format
  useEffect(() => {
    if (queryEmb.data && locations) {
      // compare query embedding to all meal embeddings from each location
      const meals = locations.map((location) => location.meals).flat();
      const mealEmbeddings = meals.map((meal) => ({
        id: meal.id,
        embedding: meal.embeddings,
      }));
      const queryEmbedding = queryEmb.data as number[];
      const similarities = mealEmbeddings.map((mealEmbedding) => ({
        id: mealEmbedding.id,
        similarity: cosSimilarity(queryEmbedding, mealEmbedding.embedding),
      }));
      const top3 = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map((similarity) => similarity.id);
      setTop3(top3);
    }
  }, [queryEmb.data, locations]);
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="px-4 py-4 mx-auto max-w-7xl md:py-12 sm:px-6 lg:px-8 lg:py-24">
        <div className="space-y-4 lg:space-y-12">
          <h2 style="font-family: 'Handlee', 'Arial'">Ohne Mampf kein Dampf</h2> 
          <Formik
            initialValues={{ query }}
            onSubmit={async (values) => {
              setQuery(values.query);
            }}
          >
            <Form>
              <div className="px-6 py-10 bg-gray-800 rounded-lg xl:px-10">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Worauf hast du Bock?
                </h1>
                <div className="flex flex-col mt-3 rounded-md shadow-sm md:flex-row">
                  <div className="relative flex items-stretch flex-grow focus-within:z-10">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MagnifyingGlassIcon
                        className="w-5 h-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <Field
                      type="text"
                      name="query"
                      minLength={3}
                      className="block w-full pl-10 border-gray-600 rounded-t-md md:rounded-none md:rounded-l-md focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Katzenfutter..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="relative inline-flex items-center justify-center px-4 py-2 -ml-px space-x-2 text-sm font-medium text-white bg-blue-500 border border-gray-600 md:justify-start rounded-b-md md:rounded-none md:rounded-r-md hover:bg-blue-400 focus:border-blue-500"
                  >
                    <SparklesIcon
                      className="w-5 h-5 text-white"
                      aria-hidden="true"
                    />
                    <span>Schlag was vor!</span>
                  </button>
                </div>
                <div className="pt-6">
                  {queryEmb.isLoading && (
                    <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      Wir übrlegen...
                    </p>
                  )}
                  {queryEmb.status === "error" && (
                    <div className="text-xl font-bold tracking-tight text-red-500 sm:text-2xl">
                      {queryEmb.error.message}
                    </div>
                  )}
                  {queryEmb.status === "success" && query.length >= 3 && (
                    <div className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {top3.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                            Wie wäre es denn damit?
                          </p>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-5">
                            {top3.map((id) => {
                              const meal = locations
                                ?.map((location) => location.meals)
                                .flat()
                                .find((meal) => meal.id === id);
                              return (
                                <div
                                  key={id}
                                  className="flex flex-col space-y-2"
                                >
                                  <p className="text-xl text-white">
                                    <RoughNotation
                                      type="highlight"
                                      show={true}
                                      color="#3b82f6"
                                      iterations={2}
                                      multiline
                                      animationDuration={1000}
                                    >
                                      {meal?.name}
                                    </RoughNotation>
                                  </p>
                                  <small className="text-sm">
                                    {meal?.location.name}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xl text-gray-400">
                          Keine Vorschläge gefunden.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Form>
          </Formik>
          <Navigation selectedDate={date} />
          {locations.map((location) => (
            <div
              key={location.name}
              className="px-6 py-10 bg-gray-800 rounded-lg xl:px-10"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col space-y-6">
                  <div className="space-y-1 leading-6">
                    <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {location.name}
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                      Addressenstraße 42
                    </p>
                  </div>
                  <p className="max-w-md mt-6 text-sm text-gray-400">
                    {location.description}
                  </p>
                </div>
                <ul role="list" className="divide-y divide-gray-700">
                  {location.meals.map((meal) => (
                    <li
                      key={location.name + " " + meal.name}
                      className="flex items-center gap-3 py-4 first:pt-0 last:pb-0 group"
                    >
                      <RoughNotation
                        type="box"
                        strokeWidth={3}
                        color="#3b82f6"
                        padding={[7, 7, 7, 7]}
                        show={
                          query &&
                          queryEmb.status === "success" &&
                          top3.includes(meal.id)
                            ? true
                            : false
                        }
                        multiline={true}
                      >
                        <div className="font-medium text-white transition-colors group-hover:text-blue-400">
                          {meal.name}
                        </div>
                        {(meal.tags as string[]).length > 0 && (
                          <div className="flex gap-2 pt-2">
                            {((meal.tags as string[]) || []).map((tag) => (
                              <div
                                key={tag}
                                className="text-xs font-medium text-gray-400 bg-gray-700 rounded-md px-1 py-0.5 mr-1
                                  group-hover:bg-blue-400 group-hover:text-white transition-colors"
                              >
                                {tag}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="pt-2 text-sm text-white">
                          Preis:{" "}
                          {meal.price
                            .sort((a, b) => a.price - b.price)
                            .map((p) => p.price.toFixed(2) + " €")
                            .join(" / ")}
                        </div>
                      </RoughNotation>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
