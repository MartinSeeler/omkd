import type { NextPage } from "next";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const mealsData = trpc.useQuery(["meals-by-date", { date: "2022-09-17" }]);
  console.log(mealsData);
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8 lg:py-24">
        <div className="space-y-12">
          {mealsData.data?.map((location) => (
            <div
              key={location.name}
              className="rounded-lg bg-gray-800 py-10 px-6 xl:px-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6 flex flex-col">
                  <div className="space-y-1 leading-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
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
                      className="flex items-center py-4 first:pt-0 last:pb-0 gap-x-3"
                    >
                      <div className="flex min-w-0 flex-1 items-center">
                        <div className="min-w-0 flex-1">
                          <div className="space-y-2">
                            <p className="truncate font-medium text-white flex-1">
                              {meal.name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {meal.price.length > 0
                            ? meal.price[0].price + "€"
                            : "Gratis"}
                        </p>
                      </div>
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
