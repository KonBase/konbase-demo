'use client';
import { use } from 'react';
import DetailPage from '@/components/layout/DetailPage';

type Convention = {
  id: string;
  name: string;
  description?: string;
  status: string;
  location?: string;
  start_date: string;
  end_date: string;
};
const d = (v: string) => new Date(v).toLocaleDateString();

export default function ConventionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <DetailPage<Convention>
      id={id}
      url='/api/conventions'
      pick={j =>
        (j as { data: { data?: Convention[] } | Convention[] }).data instanceof
        Array
          ? (j as { data: Convention[] }).data
          : ((j as { data: { data: Convention[] } }).data.data ?? [])
      }
      backHref='/conventions'
      backLabel='Conventions'
      title={c => c.name}
      fields={c => [
        ['Status', c.status],
        ['Dates', `${d(c.start_date)} – ${d(c.end_date)}`],
        ['Location', c.location],
        ['Description', c.description],
      ]}
    />
  );
}
