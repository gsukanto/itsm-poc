import React from 'react';
import { useParams } from 'react-router-dom';
import { useSupplierQuery } from '../../services/api';
import { DetailView } from '../../components/GenericDetail';

export function SupplierDetail() {
  const { id } = useParams();
  const { data, isFetching } = useSupplierQuery(id!);
  return <DetailView title={data?.name ?? 'Supplier'} data={data} loading={isFetching} backTo="/suppliers" highlight={['key', 'isActive']} />;
}
