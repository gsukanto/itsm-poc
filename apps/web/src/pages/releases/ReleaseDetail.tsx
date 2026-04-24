import React from 'react';
import { useParams } from 'react-router-dom';
import { useReleaseQuery } from '../../services/api';
import { DetailView } from '../../components/GenericDetail';

export function ReleaseDetail() {
  const { id } = useParams();
  const { data, isFetching } = useReleaseQuery(id!);
  return <DetailView title={data?.name ?? 'Release'} data={data} loading={isFetching} backTo="/releases" highlight={['refNo', 'status', 'type']} />;
}
