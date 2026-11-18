'use client';
import { use } from 'react';
import DetailPage from '@/components/layout/DetailPage';

type EquipmentSet = {
  id: string;
  name: string;
  description?: string;
  items: { id: string; quantity: number; item: { name: string } }[];
};

export default function EquipmentSetDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <DetailPage<EquipmentSet>
      id={id}
      url='/api/inventory/equipment-sets'
      backHref='/inventory/equipment-sets'
      backLabel='Equipment sets'
      title={s => s.name}
      fields={s => [
        ['Description', s.description],
        ['Items', s.items.map(i => `${i.quantity}× ${i.item.name}`).join(', ')],
      ]}
    />
  );
}
