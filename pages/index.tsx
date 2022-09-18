import type { NextPage } from "next";
import { trpc } from "../utils/trpc";
// @ts-ignore
import cosSimilarity from "cos-similarity";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Formik, Field, Form } from "formik";
import { useEffect, useState } from "react";
import { RoughNotation } from "react-rough-notation";

const Home: NextPage = () => {
  const [query, setQuery] = useState("");
  const [top3, setTop5] = useState([] as number[]);
  const queryEmb = trpc.useQuery(["similar", { query }], {
    enabled: query.length >= 3,
    retry(failureCount, error) {
      if (error.data?.httpStatus === 403) return false;
      return failureCount < 3;
    },
  });
  // get current date in YYYY-MM-DD format
  const mealsData = trpc.useQuery([
    "meals-by-date",
    { date: new Date().toISOString().slice(0, 10) },
    // { date: "2022-09-15" },
  ]);
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
      <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8 lg:py-24">
        <div className="space-y-12">
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
                <div className="mt-3 flex rounded-md shadow-sm">
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
                      className="block w-full rounded-none rounded-l-md border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Katzenfutter..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-600 bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 focus:border-blue-500"
                  >
                    <MagnifyingGlassIcon
                      className="h-5 w-5 text-white"
                      aria-hidden="true"
                    />
                    <span>Vorschläge zeigen</span>
                  </button>
                </div>
                <div className="pt-6">
                  {queryEmb.isLoading && (
                    <p className="text-xl text-white">Wir übrlegen...</p>
                  )}
                  {queryEmb.status === "error" && (
                    <div className="text-xl text-red-500">
                      {queryEmb.error.message}
                    </div>
                  )}
                  {queryEmb.status === "success" && (
                    <div className="text-xl text-gray-400">
                      {top3.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xl text-white">
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
                                      animationDelay={1000}
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
          {mealsData.status === "loading" && "Loading"}
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
