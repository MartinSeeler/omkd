import type { NextPage } from "next";
import { trpc } from "../utils/trpc";
// @ts-ignore
import cosSimilarity from "cos-similarity";
import { MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/20/solid";
import { Formik, Field, Form } from "formik";
import { useEffect, useState } from "react";
import { RoughNotation } from "react-rough-notation";

// get all dates of the current week from Mo to Su
const getWeekDates = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return [...Array(7)].map((_, i) => {
    const newDate = new Date(date.setDate(diff + i));
    return newDate.toISOString().slice(0, 10);
  });
};

type Day = {
  date: string;
  name: string;
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Home: NextPage = () => {
  const [query, setQuery] = useState("");
  const [top3, setTop5] = useState([] as number[]);
  const [weekDays] = useState(() =>
    getWeekDates().map((date, i) => {
      const day = new Date(date).getDay();
      const name = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][day];
      return { date, name } as Day;
    })
  );
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedDay, setSelectedDay] = useState(() => today);
  const queryEmb = trpc.useQuery(["similar", { query }], {
    enabled: query.length >= 3,
    retry(failureCount, error) {
      if (error.data?.httpStatus === 403) return false;
      return failureCount < 3;
    },
  });

  // get current date in YYYY-MM-DD format
  const mealsData = trpc.useQuery(["meals-by-date", { date: selectedDay }]);
  useEffect(() => {
    if (queryEmb.data && mealsData.data) {
      // compare query embedding to all meal embeddings from each location
      const meals = mealsData.data.map((location) => location.meals).flat();
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
      setTop5(top3);
    }
  }, [queryEmb.data, mealsData.data]);
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl py-4 md:py-12 px-4 sm:px-6 lg:px-8 lg:py-24">
        <div className="space-y-4 lg:space-y-12">
          <Formik
            initialValues={{ query }}
            onSubmit={async (values) => {
              setQuery(values.query);
            }}
          >
            <Form>
              <div className="rounded-lg bg-gray-800 py-10 px-6 xl:px-10">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Worauf hast du Bock?
                </h1>
                <div className="mt-3 flex flex-col md:flex-row rounded-md shadow-sm">
                  <div className="relative flex flex-grow items-stretch focus-within:z-10">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MagnifyingGlassIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <Field
                      type="text"
                      name="query"
                      minLength={3}
                      className="block w-full rounded-t-md md:rounded-none md:rounded-l-md border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Katzenfutter..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="relative -ml-px inline-flex items-center justify-center md:justify-start space-x-2 rounded-b-md md:rounded-none md:rounded-r-md border border-gray-600 bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 focus:border-blue-500"
                  >
                    <SparklesIcon
                      className="h-5 w-5 text-white"
                      aria-hidden="true"
                    />
                    <span>Schlag was vor!</span>
                  </button>
                </div>
                <div className="pt-6">
                  {queryEmb.isLoading ||
                    (mealsData.isLoading && query.length >= 3 && (
                      <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Wir übrlegen...
                      </p>
                    ))}
                  {queryEmb.status === "error" && (
                    <div className="text-xl font-bold tracking-tight text-red-500 sm:text-2xl">
                      {queryEmb.error.message}
                    </div>
                  )}
                  {queryEmb.status === "success" &&
                    mealsData.status === "success" &&
                    query.length >= 3 && (
                      <div className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        {top3.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                              Wie wäre es denn damit?
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-5">
                              {top3.map((id) => {
                                const meal = mealsData.data
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
          <div>
            <nav
              className="isolate flex divide-x divide-gray-900 rounded-lg shadow"
              aria-label="Tabs"
            >
              {weekDays.map((tab, tabIdx) => (
                <button
                  key={tab.name}
                  className={classNames(
                    tab.date === selectedDay
                      ? "text-white"
                      : "text-gray-300 hover:text-gray-100",
                    tabIdx === 0 ? "rounded-l-lg" : "",
                    tabIdx === weekDays.length - 1 ? "rounded-r-lg" : "",
                    "group relative min-w-0 flex-1 overflow-hidden bg-gray-800 py-4 px-4 text-sm font-medium text-center hover:bg-gray-700 focus:z-10"
                  )}
                  onClick={() => setSelectedDay(tab.date)}
                >
                  <span>
                    <RoughNotation
                      type="circle"
                      color="#3b82f6"
                      iterations={2}
                      strokeWidth={3}
                      padding={[8, 8, 8, 8]}
                      animationDelay={1000}
                      animationDuration={1000}
                      show={tab.date === today}
                    >
                      {tab.name}
                    </RoughNotation>
                  </span>
                  <span
                    aria-hidden="true"
                    className={classNames(
                      tab.date === selectedDay
                        ? "bg-blue-500"
                        : "bg-transparent",
                      "absolute inset-x-0 bottom-0 h-1"
                    )}
                  />
                </button>
              ))}
            </nav>
          </div>
          {mealsData.status === "loading" &&
            [0, 1, 2, 3, 4].map((idx) => (
              <div
                key={`loader-${idx}`}
                className="rounded-lg bg-gray-800 py-10 px-6 xl:px-10"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6 flex flex-col">
                    <div className="space-y-3 leading-6">
                      <div className="animate-pulse w-2/3 bg-slate-200 h-6" />
                      <div className="animate-pulse w-1/2 bg-slate-200 h-4" />
                    </div>
                  </div>
                  <ul role="list" className="divide-y divide-gray-700">
                    <li className="flex flex-col justify-start py-4 first:pt-0 last:pb-0 gap-3">
                      <div className="animate-pulse h-5 w-80 bg-slate-100" />
                      <div className="animate-pulse h-4 w-24 bg-slate-100" />
                    </li>
                    <li className="flex flex-col justify-start py-4 first:pt-0 last:pb-0 gap-3">
                      <div className="animate-pulse h-5 w-4/5 bg-slate-100" />
                      <div className="animate-pulse h-4 w-24 bg-slate-100" />
                    </li>
                    <li className="flex flex-col justify-start py-4 first:pt-0 last:pb-0 gap-3">
                      <div className="animate-pulse h-5 w-3/4 bg-slate-100" />
                      <div className="animate-pulse h-4 w-24 bg-slate-100" />
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          {mealsData.data?.map((location) => (
            <div
              key={location.name}
              className="rounded-lg bg-gray-800 py-10 px-6 xl:px-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6 flex flex-col">
                  <div className="space-y-1 leading-6">
                    <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {location.name}
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                      Addressenstraße 42
                    </p>
                  </div>
                  <p className="mt-6 text-gray-400 text-sm max-w-md">
                    {location.description}
                  </p>
                </div>
                <ul role="list" className="divide-y divide-gray-700">
                  {location.meals.map((meal) => (
                    <li
                      key={location.name + " " + meal.name}
                      className="flex items-center py-4 first:pt-0 last:pb-0 gap-3 group"
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
                        <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
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
