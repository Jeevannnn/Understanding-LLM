import Link from 'next/link';

type Subject = {
  id: number;
  title: string;
  description: string;
};

type SubjectsResponse = {
  data: Subject[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

async function getSubjects() {
  const response = await fetch(`${apiBaseUrl}/api/subjects`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to load subjects');
  }

  return (await response.json()) as SubjectsResponse;
}

export default async function SubjectsPage() {
  const { data } = await getSubjects();

  return (
    <main className="flex-1 bg-zinc-50 px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Subjects</h1>
        <p className="mt-1 text-sm text-zinc-600">Browse available subjects and enroll.</p>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((subject) => (
            <article key={subject.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">{subject.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-zinc-600">{subject.description}</p>

              <div className="mt-4">
                <Link
                  href={`/subjects/${subject.id}`}
                  className="inline-flex rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Enroll
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
