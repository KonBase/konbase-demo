'use client';
import { use } from 'react';
import DetailPage from '@/components/layout/DetailPage';

type Membership = {
  id: string;
  association_id: string;
  role: string;
  joined_at?: string;
  association: {
    name: string;
    description?: string;
    email?: string;
    website?: string;
  };
};

export default function AssociationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <DetailPage<Membership & { id: string }>
      id={id}
      url='/api/associations'
      pick={j =>
        (j as { data: Membership[] }).data.map(m => ({
          ...m,
          id: m.association_id,
        }))
      }
      backHref='/associations'
      backLabel='Associations'
      title={m => m.association.name}
      fields={m => [
        ['Your role', m.role],
        ['Description', m.association.description],
        ['Email', m.association.email],
        ['Website', m.association.website],
        ['Joined', m.joined_at && new Date(m.joined_at).toLocaleDateString()],
      ]}
    />
  );
}
