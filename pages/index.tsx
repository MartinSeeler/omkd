import type { NextPage } from "next";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  EnvelopeIcon,
} from "@heroicons/react/20/solid";

const locations = [
  {
    name: "Bischof 72",
    location: "Bischofsweg 72, 01099 Dresden",
    description:
      "In unserer Mittagskantine können Sie zwischen einem vegetarischen und einem anderen Angebot vor Ort wählen. -inkl. 1 x Dessert oder Salat Hinweise zu Allergenen und Zusatzstoffen geben wir Ihnen gerne Auskunft.",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    twitterUrl: "#",
    linkedinUrl: "#",
  },
];

const meals = [
  {
    name: "Schweinefutter an Knoblauchsoße",
    price: "2,50",
    allergenes: ["Gluten", "Milch"],
    tags: [],
  },
  {
    name: "Katzenfutter",
    price: "21,50",
    allergenes: ["Fisch"],
    tags: ["Fisch"],
  },
  {
    name: "Gebackenes Seelachsfilet mit Kräutersoße und Butterkartoffeln",
    price: "8,49",
    allergenes: ["Kalium"],
    tags: ["Fisch"],
  },
];

const Home: NextPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8 lg:py-24">
        <div className="space-y-12">
          {locations.map((person) => (
            <div
              key={person.name}
              className="rounded-lg bg-gray-800 py-10 px-6 xl:px-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6 flex flex-col">
                  <div className="space-y-1 leading-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {person.name}
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                      {person.location}
                    </p>
                  </div>
                  <p className="mt-6 text-gray-400 text-sm max-w-md">
                    {person.description}
                  </p>
                </div>
                <ul role="list" className="divide-y divide-gray-700">
                  {meals.map((meal) => (
                    <li
                      key={person.name + " " + meal.name}
                      className="flex items-center py-4 first:pt-0 last:pb-0 gap-x-3"
                    >
                      <div className="flex min-w-0 flex-1 items-center">
                        <div className="min-w-0 flex-1">
                          <div className="space-y-2">
                            <p className="truncate font-medium text-white flex-1">
                              {meal.name}
                            </p>
                            {meal.allergenes.length + meal.tags.length > 0 && (
                              <p className="flex items-center text-sm gap-x-2 gap-y-1">
                                {meal.allergenes.map((tag) => (
                                  <span
                                    key={tag + meal.name}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-700 text-white"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {meal.tags.map((tag) => (
                                  <span
                                    key={tag + meal.name}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-600 text-white"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {meal.price} €
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
